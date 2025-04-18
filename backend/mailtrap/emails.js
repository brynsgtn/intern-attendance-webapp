import { 
    VERIFICATION_EMAIL_TEMPLATE, 
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE,
    EDIT_REQUEST_EMAIL_TEMPLATE,
    APPROVAL_DENIAL_TEMPLATE,
    COMPLETION_TEMPLATE
 } from "./emailTemplates.js";
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
};

export const sendPasswordResetEmail = async (email, firstName, resetURL) => {
	const recipient = [{ email }];

	try {
		const response = await mailtrapClient.send({
			from: sender,
			to: recipient,
			subject: "Reset your password",
			html: PASSWORD_RESET_REQUEST_TEMPLATE
                .replace("{firstName}", firstName)
                .replace("{resetURL}", resetURL),
			category: "Password Reset",
		});
	} catch (error) {
		console.error(`Error sending password reset email`, error);

		throw new Error(`Error sending password reset email: ${error}`);
	}
};

export const sendResetSuccessEmail = async (email, firstName) => {
    const recipient = [{ email }];

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Password Reset Successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE
                .replace("{firstName}", firstName),
            category: "Password Reset",
        });

        console.log("Password reset email sent successfully", response);
    } catch (error) {
        console.error(`Error sending password reset email`, error);

		throw new Error(`Error sending password reset email: ${error}`);
    };
}

export const sendEditRequestEmail = async (email, memberName, type, requestReason) => {
    const recipient = [{ email }];
    const emailContent = EDIT_REQUEST_EMAIL_TEMPLATE
        .replace("{memberName}", memberName)
        .replace("{type}", type)
        .replace("{requestReason}", requestReason);

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Attendance Edit Request",
            html: emailContent,
            category: "Attendance Edit Request",
        });

        console.log("Edit request email sent successfully", response);
    } catch (error) {
        console.error("Error sending edit request email", error);
        throw new Error(`Error sending edit request email: ${error}`);
    }
};

export const sendApprovalDenialEmail = async (email, memberName, status, changeDetails) => {
    const recipient = [{ email }];
    const emailContent = APPROVAL_DENIAL_TEMPLATE
        .replace("{status}", status)
        .replace("{status}", status)
        .replace("{memberName}", memberName)
        .replace("{changeDetails}", changeDetails);

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: `Your Edit Request has been ${status}`,
            html: emailContent,
            category: "Edit Request Status Update",
        });

        console.log(`Edit request ${status} email sent successfully`, response);
    } catch (error) {
        console.error(`Error sending edit request ${status} email`, error);
        throw new Error(`Error sending edit request ${status} email: ${error}`);
    }
};

export const sendCompletionEmail = async (email, memberName) => {
    const recipient = [{ email }];
    const emailContent = COMPLETION_TEMPLATE
        .replace("{memberName}", memberName);

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: `Your Internship has been Completed`,
            html: emailContent,
            category: "Internship Completion Notification",
        });

        console.log(`Completion email sent successfully to ${email}`, response);
    } catch (error) {
        console.error(`Error sending completion email to ${email}`, error);
        throw new Error(`Error sending completion email: ${error}`);
    }
};
