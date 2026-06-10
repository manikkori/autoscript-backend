const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/signup' , async (req, res) =>{

    try{

        const {email , password} = req.body;

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({

                success:false,
                message:"email is already register!"

            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password , salt);

        const newUser  = new User({

            email:email,
            password:hashedPassword
        });

        await newUser.save();


        res.status(201).json({
            success:true,
            message:"User register successfully"
        });




    }catch(error){
        res.status(500).json({
            success:false,
            message:"internal server error",
            error:error.message
        });
    }

});

router.post('/login' , async (req , res)=>{

    try{

        const{email , password} = req.body;

        const user = await User.findOne({email});

        if(!user){
            res.status(400).json({
                success:false,
                message:"user not register"
            });
        }

        const isMatch = await bcrypt.compare(password , user.password);
        if(!isMatch){
            res.status(400).json({
                success:false,
                message:"incorrect password !!"
            });
        }

        const token = jwt.sign({userId:user._id } , JWT_SECRET , {expiresIn:'7d'});
        
        res.status(200).json({
            success:true,
            message:"Login successfully",
            token:token
        });

    }catch(err){
        res.status(500).json({
            success:false,
            message:"Internal server error!!",
        });
    }

});

module.exports = router;