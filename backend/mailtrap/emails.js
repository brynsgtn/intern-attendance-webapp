import { VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js";
import { mailtrapClient, sender } from "./mailtrapConfig.js";


export const sendVerificationEmail = async (email, verificationToken) => {
    const recipient = [{ email }];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email Verification",
        });
        console.log("Email sent successfully", response);
    } catch (error) {
        console.error(`Error sending verification`, error);
        throw new Error(`Error sending verification email: ${error}`);
    };
};


export const sendWelcomeEmail = async (email, name) => {
    const recipient = [{ email }];

    try {

        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            template_uuid: "1bcb4426-dfd3-46e7-93a1-00c60f6fe595",
            template_variables: {
                "company_info_name": "Ollopa Corporation",
                "name": name,
                "company_info_address": "No. 22 Ipil St Sitio Seville",
                "company_info_city": "Quezon City",
                "company_info_zip_code": "1100",
                "company_info_country": "Philippines"
            }
        });
        console.log("Welcome email sent successfully", response);
    } catch (error) {
        console.error(`Error sending welcome email`, error);
        throw new Error(`Error sending welcome email: ${error}`);
    }
}