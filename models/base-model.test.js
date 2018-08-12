// Matthew Lester NEA Project - base-model.test.js (Base Model Tests)

// File Being Tested
import BaseModel from './base-model';

// Tests

test('run a function when the model has been indexed', async () => {
    let exampleSchema = {
        someData: String
    };
    let someModel = new BaseModel('Example', exampleSchema);
    
    let returnTrue = () => true;
    await expect(someModel.runOnIndex(returnTrue)).resolves.toBe(true);
});

test('trying to create a BaseModel instance without a schema or model name throws an error', async () => {
    let createBlankModel = () => new BaseModel();
    expect(createBlankModel).toThrow();
    
    let createBlankModelWithSchema = () => new BaseModel({});
    expect(createBlankModelWithSchema).toThrow();
});