const reviewModel = require("../models/reviewModel")
const bookModel = require("../models/bookModel")
const mongoose = require("mongoose")

const type = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}

const createReview = async function (req, res) {
    try {
        let bookId = req.params.bookId;
        let data = req.body;

        const { reviewedBy, rating, review } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "No Parameters Passed in requestBody" })
        }

        //bookId validation
        if (!(mongoose.Types.ObjectId.isValid(bookId))) {
            return res.status(400).send({ status: false, msg: "Not a valid bookId" })
        }
        if (!(mongoose.Types.ObjectId.isValid(data.bookId))) {
            return res.status(400).send({ status: false, msg: "Not a valid bookId" })
        }

        //mandatory validation
        if (!data.bookId) {
            return res.status(400).send({ status: false, msg: "BookId is required" })
        }
        if (bookId !== data.bookId) {
            return res.status(400).send({ status: false, msg: "BookId Not Matched" })
        }
        if (!type(rating)) {
            return res.status(400).send({ status: false, msg: "Rating is required" })
        }
        if (!type(review)) {
            return res.status(400).send({ status: false, msg: "Review is required" })
        }
        if (!(rating > 0 && rating < 6)) {
            return res.status(400).send({ status: false, msg: "Invalid Ratings" })
        }

        let searchBookId = await bookModel.findById(bookId)
        if (!searchBookId) {
            return res.status(404).send({ status: false, msg: "No Book is Exist" })
        }
        //destructing object to get keys from above book
        let { title, excerpt, ISBN, userId, category, subcategory, reviews, releasedAt, isDeleted, createdAt, updatedAt } = searchBookId //destruturing object

        //creating review
        let saveReview = await reviewModel.create(data)
        if (saveReview) {
            let updateBooks = await bookModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { $inc: { reviews: 1 } }, { new: true })
        }

        //getting all reviews 
        let reviewsData = await reviewModel.find({ bookId: bookId }).select({ _id: 1, bookId: 1, reviewedBy: 1, rating: 1, review: 1, reviewedAt: 1 })

        let bookDocument = { title, excerpt, ISBN, userId, category, subcategory, reviews, releasedAt, isDeleted, createdAt, updatedAt, reviewsData }

        res.status(201).send({ status: true, msg: "Reviewed Successfully", data: bookDocument })

    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}



const updateReviews = async function (req, res) {
    try {
        let bookId = req.params.bookId;
        let reviewId = req.params.reviewId;
        let data = req.body;

        let { reviewedBy, rating, review } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "No Parameters Passed in requestBody" })
        }

        //ObjectId Validation 
        if (!(mongoose.Types.ObjectId.isValid(bookId))) {
            return res.status(400).send({ status: false, msg: "Not a valid bookId" })
        }

        if (!(mongoose.Types.ObjectId.isValid(reviewId))) {
            return res.status(400).send({ status: false, msg: "Not a valid reviewId" })
        }

        //Mondatory validation
        if (!type(reviewedBy)) {
            return res.status(400).send({ status: false, msg: "reviewedBy is mandatory" })
        }
        if (!type(rating)) {
            return res.status(400).send({ status: false, msg: "rating is mandatory" })
        }
        if (!type(review)) {
            return res.status(400).send({ status: false, msg: "review is mandatory" })
        }

        let checkBook = await bookModel.findOne({ _id: bookId, isDeleted: false })

        if (!checkBook) {
            return res.status(404).send({ status: false, msg: "Book is already Deleted" })
        }
        else {
            let checkReview = await reviewModel.findOne({ _id: reviewId, isDeleted: true })
            if (checkReview) {
                return res.status(404).send({ status: false, msg: "Review already is Deleted" })
            }
            else {
                //updating review
                let updateReview = await reviewModel.findOneAndUpdate({ _id: reviewId, isDeleted: false }, { $set: data }, { new: true })

                //destructing object to get keys from above book
                const { title, excerpt, ISBN, userId, category, subcategory, reviews, releasedAt, isDelated, createdAt, updatedAt } = checkBook

                //getting all reviews 
                let reviewsData = await reviewModel.find({ bookId: bookId }).select({ _id: 1, bookId: 1, reviewedBy: 1, rating: 1, review: 1, reviewedAt: 1 })

                const bookWithReviews = { title, excerpt, ISBN, userId, category, subcategory, reviews, releasedAt, isDelated, createdAt, updatedAt, reviewsData }

                return res.status(200).send({ status: true, msg: "Review Updated", data: bookWithReviews })
            }
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}



const deleteReviews = async function (req, res) {
    try {
        let bookId = req.params.bookId;
        let reviewId = req.params.reviewId;

        //ObjectId validation
        if (!(mongoose.Types.ObjectId.isValid(bookId))) {
            return res.status(400).send({ status: false, msg: "Not a valid bookId" })
        }

        if (!(mongoose.Types.ObjectId.isValid(reviewId))) {
            return res.status(400).send({ status: false, msg: "Not a valid reviewId" })
        }

        let checkBookId = await bookModel.findOne({ _id: bookId, isDeleted: false })

        if (!checkBookId) {
            return res.status(404).send({ status: false, msg: "Book is already Deleted" })
        }

        else {
            const { reviews } = checkBookId //destructing object get key

            let checkReview = await reviewModel.findOne({ _id: reviewId, isDeleted: false })
            if (!checkReview) {
                return res.status(404).send({ status: false, msg: "review is already Deleted" })
            }
            else {
                let deleteReview = await reviewModel.findOneAndUpdate({ _id: reviewId, isDeleted: false }, { isDeleted: true, deletedAt: Date() }, { new: true })
                if (deleteReview) {
                    let deleteBook = await bookModel.findOneAndUpdate({ _id: bookId }, { $inc: { reviews: -1 } }, { new: true })
                }
                return res.status(200).send({ status: true, msg: "Review Deleted Successfully", data: deleteReview })
            }
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports = { createReview, updateReviews, deleteReviews }