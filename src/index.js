import express from 'express';
import { vote, createBallot, getBallot } from './routes';
import bodyParser from 'body-parser';
import { validParams } from './utils';


const app = express()

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Hello World!'))
app.get('/api/ballot/:ballot_id', (req, res) => {
    getBallot(req.params.ballot_id, (err, ballot) => {
        if(err) {
            console.log(err)
            return sendError(res, 'An error occurred', 500);
        }
        return res.status(200).json({ ...ballot });
    });
});
app.post('/api/create-ballot',  (req, res) => {
    if(!validParams(req.body, ['endTime', 'voters'])) 
        return sendError(res, 'Invalid parameters provided');
    const { endTime, voters } = req.body;
    createBallot(endTime, voters, (err, uuid) => {
        if(err) {
            console.log(err)
            return sendError(res, 'An error occurred', 500);
        }
        return res.status(200).json({ ballotId: uuid });
    });
});
app.post('/api/vote', (req, res) => {
    console.log(req.query)
    if(!validParams(req.query, ['id', 'ballotId', 'voterName', 'emailAddress'])) 
        return sendError(res, 'Invalid parameters provided');
    const {id, ballotId, voterName, emailAddress} = req.query;
    vote(voterName, parseInt(id), ballotId, emailAddress, (err, counted) => {
        if(err) {
            console.log(err)
            return sendError(res, 'An error occurred', 500);
        }
        if(counted)
            return res.sendStatus(200);
        else   
            return sendError(res, 'Past deadline', 409);
    });
});

app.listen(3000, () => console.log('Example app listening on port 3000!'))

const sendError = (res, error, code = 400) => {
    res.status(code).json({ error });
}