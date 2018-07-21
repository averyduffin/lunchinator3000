import request from 'request';
import async from 'async';
import { getMultipleRandomInt } from './utils';
import encodeUrl from 'encodeurl';

const ALL_RESTAURANTS = 'https://interview-project-17987.herokuapp.com/api/restaurants';
const ONE_RESAURANT = 'https://interview-project-17987.herokuapp.com/api/restaurants/';
const REVIEWS = 'https://interview-project-17987.herokuapp.com/api/reviews';

export const getBallotRestaurants = (callback) => {
    request.get({url: ALL_RESTAURANTS, json: true },(err, response, body) => {
        if(err) callback(err);
        const restaurants = chooseRandomRestaurants(body);
        async.map(restaurants, getReview, (err, normalizedRestaurants) => {
            if(err) callback(err);
            return callback(null, normalizedRestaurants);
        });
    });
}

const getReview = (restaurant, callback) => {
    const validName = encodeUrl(restaurant.name)
    request.get({url: `${REVIEWS}/${validName}`, json: true}, (err, response, body) => {
        if(err) callback(err, response);
        callback(null, { ...restaurant, ...normalizeReviews(body), votes: 0})
    });
};

const chooseRandomRestaurants = (restaurants) => {
    const randNumbers = getMultipleRandomInt(restaurants.length, 5)
    return randNumbers.map(index => {
        return restaurants[index];
    });
};

const normalizeReviews = (reviews) => {
    let sum = 0;
    let topRating = 0;
    let topReviewer = null;
    let topReview = null;
    reviews.forEach(review => {
        const rating = parseInt(review.rating);
        if(topRating < rating) {
            topRating = rating;
            topReview = review.review;
            topReviewer = review.reviewer;
        }
        sum += rating;
    });
    const average = sum/reviews.length;
    return { average, topReview, topReviewer}
}