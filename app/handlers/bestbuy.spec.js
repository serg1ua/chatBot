/* eslint-disable no-unused-vars */
const fs = require('fs');
const rp = require('request-promise');
const expect = require('chai').expect;
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

var module = require('./bestbuy');

before(function () {
  chai.use(sinonChai);
});

beforeEach(function () {
  this.sandbox = sinon.sandbox.create();
});

afterEach(function () {
  this.sandbox.restore();
});
