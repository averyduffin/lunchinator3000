import _ from 'lodash';

export const validParams = (obj, params) => {
    const missing = params.map(key => {
        const val = _.get(obj, key);
        return _.isNil(val) || (_.isString(val) && val.trim() === '');
    });
    return !missing.includes(true);
};

export const getMultipleRandomInt = (max, quantity) => {
    const numbers = [];
    while(numbers.length !== quantity) {
        const rand = Math.floor(Math.random() * Math.floor(max));
        if(!numbers.includes(rand))
            numbers.push(rand);
    }
    return numbers;
}