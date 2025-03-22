

export const signup = async(req, res) => {
    res.send("Sign up");
};

export const verifyEmail = async(req, res) => {
    res.send("Verify Email");
};

export const login = async(req, res) => {
    res.send("Login");
};

export const logout = async(req, res) => {
    res.send("Log out");
};

export const forgetPassword = async(req, res) => {
    res.send("Forget password");
};

export const resetPassword = async(req, res) => {
    res.send("Reset password");
};

export const checkAuth = async(req, res) => {
    res.send("Chek authorization");
};