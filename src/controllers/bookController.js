const bookModel = require("../models/bookModel");
const reviewModel = require("../models/reviewModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose")


const type = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}


const createBook = async function (req, res) {
    try {

        let data = req.body;
        const IdofDecodedToken = req.userId;

        const { title, excerpt, ISBN, userId, category, subcategory, releasedAt } = data

        //mandatory validation
        if (Object.keys(data) == 0) {
            return res.status(400).send({ status: false, msg: "No Parameter Passed in RequestBody" })
        }
        if (!type(title)) {
            return res.status(400).send({ status: false, msg: "title is mandatory, provide title" })
        }
        if (!type(excerpt)) {
            return res.status(400).send({ status: false, msg: "excerpt is mandatory, provide excerpt" })
        }
        if (!type(userId)) {
            return res.status(400).send({ status: false, msg: "userId is mandatory, provide userId" })
        }
        if (!type(ISBN)) {
            return res.status(400).send({ status: false, msg: "ISBN is mandatory, provide ISBN" })
        }
        if (!type(category)) {
            return res.status(400).send({ status: false, msg: "category is mandatory, provide category" })
        }
        if (!type(subcategory)) {
            return res.status(400).send({ status: false, msg: "subcategory is mandatory, provide subcategory" })
        }
        if (!type(releasedAt)) {
            return res.status(400).send({ status: false, msg: "releasedAt is mandatory, provide releasedAt" })
        }

        //unique validation
        let searchTitle = await bookModel.findOne({ title: title })
        if (searchTitle) {
            return res.status(400).send({ status: false, msg: "title is already present" })
        }

        let searchISBN = await bookModel.findOne({ ISBN: ISBN })
        if (searchISBN) {
            return res.status(400).send({ status: false, msg: "ISBN is already present" })
        }

        const removespace = releasedAt.replace(/\s/g, '');

        //date format validation
        if (!(/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/.test(removespace))) {
            return res.status(400).send({ status: false, msg: "ReleasedAt is Not a valid Format" })
        }
        data.releasedAt = removespace; //


        if ((ISBN.trim().length <= 12)) {
            return res.status(400).send({ status: false, msg: "Not a valid ISBN" })
        }

        if (!(mongoose.Types.ObjectId.isValid(userId))) {
            return res.status(400).send({ status: false, msg: "Not a valid userId" })
        }

        let searchUserId = await userModel.findById(userId)
        if (!searchUserId) {
            return res.status(404).send({ status: false, msg: "User is Not Found" })
        }
        // checkig authorization
        if (data.userId !== IdofDecodedToken) {
            return res.status(401).send({ status: false, msg: "Unauthorized Access! User Does Not Matched" })
        }

        let saveData = await bookModel.create(data)
        return res.status(201).send({ status: true, msg: "book is created", data: saveData })

    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}



const getBooks = async function (req, res) {
    try {
        let checkCondition = { isDeleted: false }
        let data = req.query;

        let data1 = Object.assign(data, checkCondition)  //Combining two Objects

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "No Parameter Passed in RequestBody" })
        }

        let findBooks = await bookModel.find(data1).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, reviews: 1, releasedAt: 1 }).collation({ locale: "en" }).sort({ title: 1 })

        if (Object.keys(findBooks).length == 0) {
            return res.status(404).send({ status: false, msg: "No Books is Found" })
        } else {
            return res.status(200).send({ status: true, msg: "Books List", data: findBooks })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }

}


const getBooksById = async function (req, res) {
    try {
        let bookId = req.params.bookId;

        if (!(mongoose.Types.ObjectId.isValid(bookId))) {
            return res.status(400).send({ status: false, msg: "Not a valid bookId" })
        }

        let searchBookId = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!searchBookId) {
            return res.status(404).send({ status: false, msg: "No Book is Present" })

        } else {
            let reviewsData = await reviewModel.find({ bookId: bookId, isDeleted: false }).select({ _id: 1, bookId: 1, reviewedBy: 1, reviewdAt: 1, rating: 1, review: 1 })

            let { title, excerpt, ISBN, userId, category, subcategory, reviews, releasedAt } = searchBookId

            let bookWithReviews = { title, excerpt, ISBN, userId, category, subcategory, reviews, releasedAt, reviewsData }
            return res.status(200).send({ status: true, msg: "Success", data: bookWithReviews })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}



const updateBooks = async function (req, res) {
    try {
        let bookId = req.params.bookId;
        let data = req.body;

        let { title, ISBN, releasedAt, excerpt } = data
        const IdofDecodedToken = req.userId

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "No Parameters Passed In Request" })
        }
        //bookId validation
        if (!(mongoose.Types.ObjectId.isValid(bookId))) {
            return res.status(400).send({ status: false, msg: "Not a valid bookId" })
        }

        //Mandotaroy validation
        if (!type(title)) {
            return res.status(400).send({ status: false, msg: "title is mandatory, provide title" })
        }
        if (!type(excerpt)) {
            return res.status(400).send({ status: false, msg: "excerpt is mandatory, provide excerpt" })
        }
        if (!type(ISBN)) {
            return res.status(400).send({ status: false, msg: "ISBN is mandatory, provide ISBN" })
        }
        if (!type(releasedAt)) {
            return res.status(400).send({ status: false, msg: "releasedAt is mandatory, provide releasedAt" })
        }


        //date format validation
        if (!(/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/.test(releasedAt))) {
            return res.status(400).send({ status: false, msg: "ReleasedAt is Not a valid Format" })
        }
        if ((ISBN.trim().length <= 12)) {
            return res.status(400).send({ status: false, msg: "Not a valid ISBN" })
        }

        let findData = await bookModel.findById(bookId)
        if (!findData) {
            return res.status(404).send({ status: false, msg: "No book is Present" })
        }
        else {
            //checking authorization 
            if (findData.userId.toString() !== IdofDecodedToken) {
                return res.status(401).send({ status: false, msg: "Unauthorized Access! Invalid Credentials" })
            }

            let searchBookId = await bookModel.findOne({ _id: bookId, isDeleted: true })
            if (searchBookId) {
                return res.status(400).send({ status: false, msg: "Book is Already Deleted" })

            } else {
                //update validation
                let checktitle = await bookModel.findOne({ title: title })
                if (checktitle) {
                    return res.status(400).send({ status: false, msg: "title is already Present" })
                }
                let checkISBN = await bookModel.findOne({ ISBN: ISBN })
                if (checkISBN) {
                    return res.status(400).send({ status: false, msg: "ISBN is already Present" })
                }

                //updating Book
                let updateBook = await bookModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { $set: data, }, { new: true })
                return res.status(200).send({ status: true, msg: "Book Updated Successfully", data: updateBook })
            }
        }
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }

}



const deleteBooks = async function (req, res) {
    try {
        let bookId = req.params.bookId;
        const IdofDecodedToken = req.userId

        if (!(mongoose.Types.ObjectId.isValid(bookId))) {
            return res.status(400).send({ status: false, msg: "Not a valid bookId" })
        }

        let findBookId = await bookModel.findById(bookId)
        if (!findBookId) {
            return res.status(404).send({ status: false, msg: "No book is Present" })
        }
        else {
            //checking authorization 
            if (findBookId.userId.toString() !== IdofDecodedToken) {
                return res.status(401).send({ status: false, msg: "Unauthorized Access! Invalid Credentials" })
            }

            let checkBook = await bookModel.findOne({ _id: bookId, isDeleted: true })
            if (checkBook) {
                return res.status(400).send({ status: false, msg: "Book is Already Deleted" })
            }
            else {
                let deleteBook = await bookModel.findOneAndUpdate({ _id: bookId }, { isDeleted: true, deletedAt: Date() }, { new: true })
                return res.status(200).send({ status: true, msg: "Book Deleted Successfully", data: deleteBook })
            }
        }
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports = { createBook, getBooks, getBooksById, updateBooks, deleteBooks }