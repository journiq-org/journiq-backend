import dotenv from "dotenv";
import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";

dotenv.config()
console.log("MAIL_HOST fromemail.js :", process.env.MAIL_HOST);
console.log("MAIL_PORT:", process.env.MAIL_PORT);

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    }
});

// Set up Handlebars templating
const __dirname = path.resolve(); // Only if using ESModules
transporter.use("compile", hbs({
    viewEngine: {
        extname: ".handlebars",
        partialsDir: path.resolve(__dirname, "views"),
        defaultLayout: false,
    },
    viewPath: path.resolve(__dirname, "views"),
    extName: ".handlebars",
}));

export default transporter;





// import nodemailer from "nodemailer";
// import hbs from "nodemailer-express-handlebars";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// console.log(process.env.MAIL_PORT,"mail port...")

// // Create transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.MAIL_HOST,   // Mailtrap host
//   port: process.env.MAIL_PORT || 2525,   // 2525 for Mailtrap
//   secure: false, // TLS not used on port 2525
//   auth: {
//     user: process.env.MAIL_USER,
//     pass: process.env.MAIL_PASS
//   }
// });

// // Handlebars setup
// const handlebarOptions = {
//   viewEngine: {
//     extname: ".handlebars",
//     partialsDir: path.resolve(__dirname, "../views/emailTemplates"),
//     defaultLayout: false,
//   },
//   viewPath: path.resolve(__dirname, "../views/emailTemplates"),
//   extName: ".handlebars",
// };

// transporter.use("compile", hbs(handlebarOptions));

// export default transporter;



// import nodemailer from "nodemailer";
// import hbs from "nodemailer-express-handlebars";
// import path from "path";
// import { fileURLToPath } from "url";



// // Define __filename and __dirname manually
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Mailtrap SMTP config
// const transporter = nodemailer.createTransport({
//     host: process.env.MAIL_HOST,
//     port: process.env.MAIL_PORT,
//     auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASS
//     }
// });

// // Template engine setup
// transporter.use('compile', hbs({
//     viewEngine: {
//         extname: '.hbs',
//         layoutsDir: path.join(process.cwd(), 'views/emailTemplates'),
//         defaultLayout: false
//     },
//     // viewPath: path.join(process.cwd(), 'views/emailTemplates'),
//     viewPath: path.join(__dirname, 'views/emailTemplates'),
//     extName: '.hbs'
// }));

// export const sendEmail = async (to, subject, template, context) => {
//     await transporter.sendMail({
//         from: '"Tour Booking" <no-reply@tourapp.com>',
//         to,
//         subject,
//         template,
//         context
//     });
// };
