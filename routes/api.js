/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const MongoClient = require('mongodb');
const request = require('request');
const mongoose = require('mongoose');

const APIURL = "https://api.iextrading.com/1.0/stock/";

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});
mongoose.connect(CONNECTION_STRING);
// const db = mongoose.connection;

const stockLikeSchema = new mongoose.Schema({
  name: String,
  ipArr: Array
})

const stockLikes = mongoose.model('stockLikes', stockLikeSchema);

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      let priceData = [];
      const ipAddress = req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].substr(0,12) : "test";
      // Prepare the response
      const prepareResponse = () => {
        if (priceData.length === 1) {
          return res.send({stockData: priceData[0]});
        } else {
          priceData[0].rel_likes = priceData[0].likes - priceData[1].likes;
          priceData[1].rel_likes = priceData[1].likes - priceData[0].likes;
          priceData.map(element => {
            delete element.likes;
          });
          return res.send({stockData: [priceData[0], priceData[1]]});
        }
      }
      const prepareLikes = () => {
        if (priceData.length === 1) {
          findLikes(priceData[0].stock);
        } else {
          findLikes(priceData[0].stock, () => { findLikes(priceData[1].stock) });
        }
      }
      // Check database to see if stockData exists if there is a like
      const findLikes = (stockName, callback) => {
        stockLikes.find({name: stockName}, (err, docs) => {
          if (err) return prepareResponse();
          if (docs.length === 0) {
            // If it doesn't exist, save it
            const stockToAdd = new stockLikes({
              name: stockName,
              ipArr: []
            });
            // If user wants to like the stock
            if (req.query.like) {
              stockToAdd.ipArr.push(ipAddress);
              // update the objects stored in priceData array in preparation for response
              priceData.map(stockItem => {
                if (stockName === stockItem.stock) {
                  stockItem.likes++;
                }
              });
            }
            stockToAdd.save((err) => {
              if (err) return console.error(err);
              callback ? callback() : prepareResponse();
            });
          } else {
            // If it exists
            let ipArray = docs[0].ipArr.slice();
            // Only count Like if one from the same IP address doesn't already exist
            if (req.query.like && ipArray.indexOf(ipAddress) === -1) {
              ipArray.push(ipAddress);
            }
            // update the objects stored in priceData array in preparation for response
            priceData.map(stockItem => {
              if (stockName === stockItem.stock) {
                stockItem.likes = ipArray.length;
              }
            });
            // update the object in mLab database
            stockLikes.findOneAndUpdate({name: stockName}, {ipArr: ipArray}, (err) => {
              if (err) return console.error(err);
              callback ? callback() : prepareResponse();
            });
          }
        });
      }
      // Function for getting the stock price from API
      const getPrice = (stockName, callback) => {
        request(APIURL+stockName+"/price", (err, response, body) => {
          if (!err && response.statusCode === 200) {
            priceData.push({
              stock: stockName,
              price: body,
              likes: 0,
            });
          }
          // Get second price
          if (callback) {
            callback();
          } else {
            prepareLikes();
          }
        });
      }
      // Deals with stock data
      const _stock = req.query.stock;
      // Check if stock exists in url query
      if (_stock) {
        // Check if it's an array i.e more than one stock
        if (typeof _stock === "string") {
          getPrice(_stock.toUpperCase());
        } else {
          getPrice(_stock[0].toUpperCase(), () => { getPrice(_stock[1].toUpperCase() )} );
        }
      }
    });
    
};
