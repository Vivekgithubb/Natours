const dotenv = require('dotenv')
dotenv.config({ path: '../config.env' })
const nodemailer = require('nodemailer')



const sendEmail = async options => {
    //1 create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }

        // activate in gmail "less secure app" option 
    })

    //2 define email options
    const mailOptions = {
        from: 'Vivek <vivek@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
    }
    console.log("Trying to send email to:", options.email);
    //3 send with nodemailer
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (err) {
        console.error('Email failed:', err);
        throw err; // so your forgotPassword catch can handle it
    }
}

module.exports = sendEmail
// const nodemailer = require('nodemailer');

// const testEmail = async () => {
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: Number(process.env.EMAIL_PORT), // ensure number
//         secure: process.env.EMAIL_PORT == 465 ? true : false,
//         auth: {
//             user: process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD,
//         },
//         logger: true,
//         debug: true,
//     });
//     console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
//     console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
//     console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME);


//     // verify connection
//     transporter.verify((err, success) => {
//         if (err) console.error("SMTP verification failed:", err);
//         else console.log("SMTP server ready:", success);
//     });

//     try {
//         const info = await transporter.sendMail({
//             from: '"Vivek" <vivek@example.com>',
//             to: "test@example.com", // any email, Mailtrap catches it
//             subject: "Mailtrap test",
//             text: "Hello, this is a test email from Nodemailer + Mailtrap",
//         });
//         console.log("Email sent:", info.response);
//     } catch (err) {
//         console.error("SendMail error:", err);
//     }
// };

// testEmail();
