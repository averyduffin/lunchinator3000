import Uuid from 'uuid/v1';
import moment from 'moment';
import async from 'async';
import { insertBallotDB, getBallotDB, insertVoteDB, getVotesDB } from './mongo';
import { getBallotRestaurants } from './restaurant-client';

export const createBallot = (endTime, voters, callback) => {
    const uuid = Uuid();
    getBallotRestaurants((err, restaraunts) => {
        if(err) return callback(err);
        insertBallotDB(uuid, endTime, voters, restaraunts, (err) => {
            callback(err, uuid);
        });
    });
};

export const getBallot = (uuid, callback) => {
    getBallotDB(uuid, (err, ballot) => {
        if(err) return callback(err);
        if(!ballot) return callback(new Error('No ballot with this id'));
        async.map(ballot.restaraunts, (rest, callback) => {
            getVotesDB(rest.id, ballot.uuid, (err, count) => {
                if(err) return callback(err);
                rest.votes = count;
                callback(null, rest)
            });
        }, (err, restaraunts) => {
            if(err) return callback(err);
            ballot.restaraunts = restaraunts;
             //ballot.endTime format is depricating in moment.js
            if(moment() < moment(ballot.endTime)) {
                return callback(null, formatRespBeforeEnd(ballot))
            }
            callback(null, formatRespAfterEnd(ballot));
        });
    });
};

export const vote = (name, restaurantId, ballotId, emailAddress, callback) => {
    getBallotDB(ballotId, (err, ballot) => {
        if(err) return callback(err);
        if(!ballot) return callback(new Error('No ballot with this id'));
        if(ballot.voters.filter(vot => vot.name === name && vot.emailAddress === emailAddress).length < 1)
            return callback(new Error('Not permitted to vote'));
        if(ballot.restaraunts.filter(rest => rest.id === restaurantId).length < 1)
            return callback(new Error('Not a valid restaurant id'));
        //ballot.endTime format is depricating in moment.js
        if(moment() >= moment(ballot.endTime)) {
            return callback(null, false);
        }
        insertVoteDB(name, restaurantId, ballotId, emailAddress, (err) => {
            if(err) return callback(err);
            callback(null, true);
        });
    });
    
};

const findHighestRated = (restaurants) => {
    if(restaurants.length < 1) return {};
    let topRestaurant = restaurants[0] //take into account if none are top.
    restaurants.forEach(rest => {
        if(topRestaurant.average < rest.average) 
            topRestaurant = rest;
    });
    const { id, name, average: averageReview, topReviewer: TopReviewer, topReview: Review } = topRestaurant;
    return { id, name, averageReview, TopReviewer, Review};
};

const findWinner = (restaraunts) => {
    if(restaraunts.length < 1) return {}
    let winner = restaraunts[0];
    restaraunts.forEach(rest => {
        if(winner.votes < rest.votes) 
            winner = rest;
    });
    const { id, name, votes } = winner;
    return { id, name, votes, dateTime: moment().format() };
};

const formatRespBeforeEnd = (ballot) => {
    const suggestion = findHighestRated(ballot.restaraunts);
    const choices = ballot.restaraunts.map(rest => {
        const { id, name, average: averageReview, description } = rest; 
        return {id, name, averageReview, description};
    });
    return { suggestion, choices };
};

const formatRespAfterEnd = (ballot) => {
    const winner = findWinner(ballot.restaraunts);
    const choices = ballot.restaraunts.map(rest => {
        const { id, name, votes } = rest; 
        return {id, name, votes};
    });
    return {winner, choices };
};