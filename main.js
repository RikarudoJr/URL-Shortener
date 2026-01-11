import "dotenv/config"
import {drizzle} from "drizzle-orm/node-postgres"
import express from "express";
import {usersTable,userSessions,urlsTable}from "./db/schema.js"
import { eq } from "drizzle-orm";
import {createHmac, randomBytes} from "node:crypto"
import cookieParser from "cookie-parser"
import {signupPostRequestBodySchema,shortenPostRequestBodySchema} from "./validation/request.validation.js"
// create a server
const server = express()
server.use(express.json());
server.use(cookieParser())

//connect to a db
const db= drizzle(process.env.DATABASE_URL);
const dbs = [];

//handler for sign up request

server.post("/signup",async(req,res)=>
{
    // extract email,password form the body
    
    const validationResult = await signupPostRequestBodySchema.safeParseAsync(req.body)
    if(validationResult.error){
        return res.json("input validation error")
    }

    const {name,email,password} = validationResult.data;
    //hashing the password
    const salt = randomBytes(256).toString("hex");
    const hashedPassword = createHmac("sha256",salt).update(password).digest("hex");
    


    //search db to confirm email doesnt exist yet
    console.log(email)
    try {
    await db.insert(usersTable).values({email:email,password:hashedPassword,name:name,salt:salt});
    } catch(err){
         console.error("DB ERROR:", err);
    }finally{
        console.log("inserted")
    }
    console.log('end of code')

    res.status(200).json("account created")

    
    //insert email and password into db
})

server.post("/login",async(req,res)=>{
    const {email,password} = req.body;// email,password
    //verify if user exist and the password matches
        //search the row that contain the email, retrieve the user salt&user password 
        let userId,salt,userPassword, result;
        try{
            [result]= await db
            .select(
                {userId: usersTable.id, 
                salt: usersTable.salt,
                userPassword:usersTable.password })
            .from(usersTable)
            .where(eq(usersTable.email, email))
    
            
        }catch(err){
            console.log(`Error retrieving user Account from database:${err}`)
        }

        ({userId,salt,userPassword}=result);

        
        //add salt into the inputed password then hash the password
            const inputPassword = createHmac("sha256",salt).update(password).digest("hex");
        //check if the hashed password in the previous step match the hashed password in the database
            if(inputPassword != userPassword){
                res.status(401).json("invalid password")
            }
            else{
                //create user Session then insert into active-sessions-table
                
                const sessionId = await db.insert(userSessions).values({userId:userId}).returning({id: userSessions.id});
                //send sessionId
                res.cookie("sessionId", sessionId).json("login succesful")
            } 
}) 

server.get("/",async(req,res)=>{

    const sessionId = req.cookies['sessionId'];
    const [data] = await db
    .select({
        id: userSessions.id,
        userId: userSessions.userId,
        name: usersTable.name,
        email: usersTable.email,
    })
    .from(userSessions)
    .rightJoin(usersTable, eq(usersTable.id, userSessions.userId))
    .where((table) => eq(table.id, sessionId));
    
    console.log(data)
    if (!data) {
    return res.redirect("http://localhost:3000/login");
    }
 
   res.status(200).json(`welcome home` )
})
server.get("/cookie",(req,res)=>{
   //redirect from localhost:/ to localhost:/{userId} path
    console.log(req.cookies['sessionId'])
   //
   //res.json("welcome")
    res.cookie("sessionId", "f472136f-b881-4642-a3e3-fda436865356");
   res.status(200).json(`cookie already sent` )
})

//Create a short URL
server.post("/shorten",async(req,res)=>{
    /* json req:
    { userId:
     shortCode:
     targetURL:
    } */

    //validate input data format
    const validateResult = await shortenPostRequestBodySchema.safeParseAsync(req.body)
    if(validateResult.error){
        console.log(validateResult.error)
        return res.json("error: format doesn't match")
    }
    
    //send into db
    const {shortCode,userId,targetURL} = validateResult.data;
    try{
        await db.insert(urlsTable).values({shortCode:shortCode,userId:userId,targetURL:targetURL});
    }catch(err){
        console.log(`Error inserting into db: ${err}`);
        return res.json("error during insertion")
    }
    return res.json("link created!")
})
//redirect to target URL

//get the list of urls a user has created
server.get("/urls",async(req,res)=>{
//retrieve session id from cookies
    const sessionId = req.cookies["sessionId"]
//db search. find userId based on  session Id 
    let data;
    try{
        [data] = await db
            .select({
                userId: userSessions.userId
            })
            .from(userSessions)
            .where(eq(userSessions.id,sessionId))

            if(!data){
                res.status(404).json("you are not logged in")
            }

    }catch(err){
        console.error(err)
        res.status(500).json("there's an error")
    }
    let data2;
    try{
        data2 = await db
        .select({shortCodeList: urlsTable.shortCode})
        .from(urlsTable)
        .where(eq(urlsTable.userId,data.userId))
    }catch(err){
        console.error(err)
        res.status(500).json("there's an error")
    }
//db search,use user id to  get the list

    console.log(data2)
    res.status(201).json(data2)
})

//get the list of urls a user has created
server.delete("/urls/:id",async(req,res)=>{
    //verify sessionId exist

            
    //delete id
})
server.get("/:shortCode",async(req,res)=>{
    //validate the req, body. make sure fiel isonly shortCode

    const {shortCode} = req.params
    //retrieve the real URL by matching the shortened URL in database
    let data;
    try{
        [data] = await db
        .select({targetURL:urlsTable.targetURL})
        .from(urlsTable)
        .where(eq(urlsTable.shortCode, shortCode))

    }catch(err){
        console.error(err)
        return res.status(500).json(`error`)

    } 
    if(!data){
        return res.status(404).json("link not found")
    }

    const targetURL = data.targetURL;
    console.log("data",data)
    res.redirect(targetURL)


    //redirect to the real URL/

})
// why the code inside finally still runs despite already return
//do i still need to validate using zod if only extracting from req.params, notreq.body
// if i do localhost:3000/signup, will it trigger the endpooint /:shortcode?


server.listen(3000, ()=> console.log("server is running in port 3000"))