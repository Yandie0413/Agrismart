const success = (res, data = null, message = 'Succes', status = 200) => {
    return res.status(status).json({ success: true, message, data });
  };
  
  const error = (res, message = 'Erreur', status = 500, data = null) => {
    return res.status(status).json({ success: false, message, data });
  };
  
  module.exports = { success, error };