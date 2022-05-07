const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");


const type = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}


const createUser = async function (req, res) {
    try {
        let data = req.body;

        const { title, name, phone, email, password, address } = data

        //Mandatory validation
        if (Object.keys(data) == 0) {
            return res.status(400).send({ status: false, msg: "No Parameter Passed" })
        }
        if (!type(title)) {
            return res.status(400).send({ status: false, msg: "No Title is Passed" })
        }
        else {
            let arr = ['Mr', 'Miss', 'Mrs']
            if (!(arr.indexOf(title.trim()) !== -1)) {
                return res.status(400).send({ status: false, msg: "Invalid enum Value" })
            }
        }
        if (!type(name)) {
            return res.status(400).send({ status: false, msg: "Name is required" })
        }
        if (!type(phone)) {
            return res.status(400).send({ status: false, msg: "phone is required" })
        }
        if (!type(email)) {
            return res.status(400).send({ status: false, msg: "email is required" })
        }
        if (!type(password)) {
            return res.status(400).send({ status: false, msg: "password is required" })
        }
        if (!type(address)) {
            return res.status(400).send({ status: false, msg: "address is required" })
        }

        //format validation
        if (!(/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[789]\d{9}$/.test(phone.trim()))) {
            return res.status(400).send({ status: false, msg: "Not a valid Number provide valid phone Number" })
        }

        if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email.trim()))) {
            return res.status(400).send({ status: false, msg: "Not a valid Email provide valid email" })
        }

        if (!(password.trim().length > 8 && password.trim().length < 15)) {
            return res.status(400).send({ status: false, msg: "Invalid Password" })
        }

        //unique validation
        let searchPhone = await userModel.findOne({ phone })
        if (searchPhone) {
            return res.status(400).send({ status: false, msg: "Phone Number is already present" })
        }

        let searchEmail = await userModel.findOne({ email })
        if (searchEmail) {
            return res.status(400).send({ status: false, msg: "Email is already present" })
        }

        let saveData = await userModel.create(data)
        return res.status(201).send({ status: true, msg: "User Created Successfully", data: saveData })
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


const userLogin = async function (req, res) {
    try {
        let data = req.body;
        let data1 = req.body.email;
        let data2 = req.body.password;

        //mandatory validation
        if (Object.keys(data) == 0) {
            return res.status(400).send({ status: false, msg: "No Parameters Passed in requestBody" })
        }
        if (!type(data1)) {
            return res.status(400).send({ status: false, msg: "email is required" })
        }
        if (!type(data2)) {
            return res.status(400).send({ status: false, msg: "password is required" })
        }

        //format validaion
        if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(data1.trim()))) {
            return res.status(400).send({ status: false, msg: "Not a valid Email provide valid email" })
        }

        if (!(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-z\-0-9]+\.)+[a-z]{2,}))$/.test(data1.trim()))) {
            return res.status(400).send({ status: false, msg: "Please enter the credentials in lowercase" })
        }

        if (!(data2.trim().length > 8 && data2.trim().length < 16)) {
            return res.status(400).send({ status: false, msg: "Invalid Password" })
        }

        let findUser = await userModel.findOne({ email: data1, password: data2 })
        if (!findUser) {
            return res.status(400).send({ status: false, msg: "Invalid Credentials" })
        } else {
            let geneToken = jwt.sign({
                userId: findUser._id,
            }, "group26", { expiresIn: "30m" });
            return res.status(201).send({ status: true, msg: "token Created Successfully", Token: geneToken })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}


module.exports = { createUser, userLogin }