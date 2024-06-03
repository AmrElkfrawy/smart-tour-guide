const TourCategory = require('../models/tourCategoryModel');
const factory = require('./handlerFactory');

exports.getAllTourCategories = factory.getAll(TourCategory);
exports.getTourCategory = factory.getOne(TourCategory);
exports.createTourCategory = factory.createOne(TourCategory);
exports.updateTourCategory = factory.updateOne(TourCategory);
exports.deleteTourCategory = factory.deleteOne(TourCategory);
