import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app .use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit:"16kb"})) //-->json se kitta data lena hai limit hai uski
app.use(express.urlencoded({extended:true,limit : "16kb"})) //-->url se data ata hai to configure karana padata hai 
app.use(express.static("public"))
app.use(cookieParser()) //-->thired party cookeis mai kam karane ke liye



// routes 
import userRouter from  './routes/user.routes.js'

//routes Declaration
app.use("/api/v20.11.0/users",userRouter)

export {app}
