const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
require('dotenv').config();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // TODO: Replace with actual user lookup from database
    const dummyUser = {
      id: 1,
      username: 'doctor',
      passwordHash: '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    };

    // TODO: Implement proper password verification
    const token = jwt.sign(
      { userId: dummyUser.id, username: dummyUser.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// WeChat mini app login
router.post('/wechat-login', async (req, res) => {
  console.log('Received WeChat login request:', {
    headers: req.headers,
    body: req.body,
    method: req.method,
    path: req.path
  });

  try {
    const { code } = req.body;
    
    if (!code) {
      console.log('Login failed: No code provided');
      return res.status(400).json({ 
        success: false, 
        message: '缺少微信授权码' 
      });
    }

    console.log('Processing login with code:', code);
    const result = await authService.wechatLogin(code);
    console.log('Login result:', result);
    
    if (!result.success) {
      console.log('Login failed:', result.error);
      return res.status(401).json({ 
        success: false, 
        message: result.error || '微信授权失败'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        wechatId: result.data.wechatId,
        accountId: result.data.accountId,
        profileId: result.data.profileId,
        accountType: result.data.accountType
      },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '7d' }
    );

    const response = {
      success: true,
      token,
      ...result.data
    };
    console.log('Sending response:', response);
    res.json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Check account profile status
router.get('/check-profile/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: '账号ID不能为空'
      });
    }

    const result = await authService.checkAccountProfile(accountId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error checking account profile:', error);
    res.status(500).json({
      success: false,
      error: '查询账号信息失败'
    });
  }
});

// Refresh token with updated needRegister value
router.post('/refresh-token', async (req, res) => {
  try {
    const { accountId, needRegister } = req.body;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: '账号ID不能为空'
      });
    }

    // Get account details
    const result = await authService.checkAccountProfile(accountId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    // Generate new token with updated needRegister value
    const token = jwt.sign(
      { 
        wechatId: result.data.wechatId,
        accountId: result.data.accountId,
        profileId: result.data.profileId,
        accountType: result.data.accountType,
        needRegister: needRegister
      },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      error: '刷新token失败'
    });
  }
});

// 检查会话状态
router.get('/check-session', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未提供有效的token'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
    res.json({
      success: true,
      expired: false
    });
  } catch (error) {
    res.json({
      success: false,
      expired: true,
      message: 'token已过期或无效'
    });
  }
});

// Get account by WeChat ID
router.get('/account-by-wechat/:wechatId', async (req, res) => {
  try {
    const { wechatId } = req.params;
    
    if (!wechatId) {
      return res.status(400).json({
        success: false,
        error: 'WeChat ID不能为空'
      });
    }

    const result = await authService.getAccountByWechatId(wechatId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting account by WeChat ID:', error);
    res.status(500).json({
      success: false,
      error: '获取账号信息失败'
    });
  }
});

module.exports = router; 