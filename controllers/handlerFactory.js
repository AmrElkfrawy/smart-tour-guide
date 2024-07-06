const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
let redisClient;
if (process.env.redis === 'true') {
    redisClient = require('./../utils/redisUtil');
}
exports.getAll = (Model) =>
    catchAsync(async (req, res, next) => {
        const cacheKey = `getAll-${Model.collection.name}-${JSON.stringify(
            req.query
        )}-${JSON.stringify(req.params)}`;

        try {
            if (process.env.redis === 'true') {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    return res.status(200).json({
                        status: 'success',
                        requestedAt: req.requestTime,
                        results: JSON.parse(cachedData).length,
                        data: {
                            docs: JSON.parse(cachedData),
                        },
                    });
                }
            }

            // To allow for nested GET reviews on Landmark/Tour/Guide (hack)
            let filter = {};

            if (req.params.subjectId)
                filter = { subject: req.params.subjectId };
            // To allow for nested GET in categories
            if (req.params.landmarkId)
                filter = { subject: req.params.landmarkId };
            else if (req.params.tourId) filter = { subject: req.params.tourId };
            else if (req.params.guideId)
                filter = { subject: req.params.guideId };

            if (req.params.categoryId)
                filter = { category: req.params.categoryId };
            if (req.params.tourCategoryId)
                filter = { category: req.params.tourCategoryId };

            // EXECUTE QUERY
            const features = new APIFeatures(Model.find(filter), req.query)
                .filter()
                .sort()
                .limitFields()
                .paginate();
            const docs = await features.query;
            if (process.env.redis === 'true') {
                if (
                    [
                        'landmarks',
                        'tours',
                        'categories',
                        'tourcategories',
                    ].includes(Model.collection.name)
                ) {
                    await redisClient.setEx(
                        cacheKey,
                        3600,
                        JSON.stringify(docs)
                    );
                }
            }
            // SEND RESPONSE
            res.status(200).json({
                status: 'success',
                requestedAt: req.requestTime,
                results: docs.length,
                data: {
                    docs,
                },
            });
        } catch (err) {
            return next(new AppError(err, 500));
        }
    });

exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (popOptions) query = query.populate(popOptions);

        const doc = await query;
        if (!doc) {
            return next(new AppError('No document found with this ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                doc,
            },
        });
    });

exports.createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const newDoc = await Model.create(req.body);
        if (process.env.redis === 'true') {
            await redisClient.flushAll();
        }
        res.status(201).json({
            status: 'success',
            data: {
                doc: newDoc,
            },
        });
    });

exports.updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!doc) {
            return next(new AppError('No document found with this ID', 404));
        }
        if (process.env.redis === 'true') {
            await redisClient.flushAll();
        }

        res.status(200).json({
            status: 'success',
            data: {
                doc,
            },
        });
    });

exports.deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError('No document found with this ID', 404));
        }
        if (process.env.redis === 'true') {
            await redisClient.flushAll();
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    });
