const User = require('../models/user_model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.createUser = async (req, res) => {
  const { email, password, firstName, lastName, phone, phone2, roleId, address, billingAddress, city, postalCode, civility, isCompany, professionalId, notes, lastVisitDate, nextVisitDate } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create(email, hashedPassword, firstName, lastName, phone, phone2, roleId, address, billingAddress, city, postalCode, civility, isCompany, professionalId, notes, lastVisitDate, nextVisitDate);
    
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.getByEmail(email);
    if (!user) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
