// CREATE TOKEN AND SAVE IT IN COOKIES

const sendShopToken = (user, statusCode, resp) => {
  const token = user.getJwtToken();

  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  };

  resp
    .status(statusCode)
    // Cookies for WEB ✅
    .cookie("seller_token", token, options)
    // Token in response for MOBILE ✅
    .json({
      success: true,
      user,
      token, // ✅ THIS is what mobile uses
    });
};

module.exports = sendShopToken;
