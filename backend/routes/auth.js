const express=require('express');
const router=express.Router();
const User=require('../models/User');
const { body , validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt=require('jsonwebtoken');
const JWT_SECRET='changululla18';
const fetchuser=require('../middleware/fetchuser');

router.post('/createuser',[
    body('name','Enter valid name').isLength({min:3}),
    body('email','Enter valid email').isEmail(),
    body('password','Password length should be atleast 5').isLength({min:5})

],async (req, res) => {
    const errors = validationResult(req);
    let success=false;
    if (!errors.isEmpty()) {
      return res.status(400).json({success, errors: errors.array() });
    }
    
    try {
      let a= await User.findOne({email:req.body.email});
      if(a)
      {
        return res.status(400).json({success,error:"Email already in use"});
      }
      const salt=await bcrypt.genSalt(10);
      const secPassword= await bcrypt.hash(req.body.password,salt);
      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPassword
      });

      const data={

        user:{
          id:user.id
        }
      }

       success=true;
      const authToken=jwt.sign(data,JWT_SECRET);
      res.json({success,authToken});
      


       
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error
        return res.status(400).json({ error: 'Email already exists' });
      }
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }

    
});

router.post('/login',[
  
  body('email','Enter valid email').isEmail(),
  body('password','Password cannot be empty').exists()

],async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {email,password}=req.body;
  let success=false;
  try {

    let user= await User.findOne({email});
    if(!user)
    {
      return res.status(400).json({error:"No User Found "});
    }

    const passwordCompare= await bcrypt.compare(password,user.password);
    if(!passwordCompare)
    {  
      return res.status(400).json({success,error:"No User Found "});
    }

    const data={

      user:{
        id:user.id
      }
    }


    const authToken=jwt.sign(data,JWT_SECRET);
    success=true;
    res.json({success,authToken});
    

    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });

    
  }

  

  
});

router.post('/getUser',fetchuser,async (req, res) => {
  

  
  try {

    const userId=req.user.id;
    const user= await User.findById(userId).select("-password");
    res.send(user);

    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });

    
  }

  

  
});

module.exports=router