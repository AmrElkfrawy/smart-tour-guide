class APIFeatures {
    constructor(query, queryString) {
        // query is mongoose query, queryString is req.query
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = [
            'page',
            'sort',
            'limit',
            'fields',
            'search',
            'location',
        ];
        excludedFields.forEach((el) => delete queryObj[el]);
        // Advanced Filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            (match) => `$${match}`
        ); // \b for finding the exact word, not when it's part of another.. g for multiple occurrences

        if (this.queryString.location) {
            const locations = this.queryString.location.split(',');
            this.query = this.query.find({
                'location.governorate': { $in: locations },
            });
        }

        if (this.queryString.search) {
            const searchRegex = new RegExp(
                '\\b' + this.queryString.search,
                'i'
            );
            this.query = this.query.find({ name: searchRegex });
        }

        this.query = this.query.find(JSON.parse(queryStr));
        return this; // To be able to chain methods.
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt'); // - for sorting in descending order
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query.select(fields);
        } else {
            this.query.select('-__v'); // - for excluding
        }

        return this;
    }

    paginate() {
        // To allow the user to select a certain page of our results in case we have a lot of results
        // page=2&limit=10  >>> if each page has 10 results then 1-10 on page 1, 11-20 on page 2, etc
        // If we want to display page 2 when we (skip) 10 results and show(limit) 10 results to display
        //query = query.skip(10).limit(10);
        const page = +this.queryString.page || 1; // Giving default value of 1
        const limit = +this.queryString.limit || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;
