const pool = require('../db');

// WeChat mini app login service
const wechatLogin = async (code) => {
    try {
        let openid;
        
        // Check if we're in development mode
        if (process.env.NODE_ENV === 'development') {
            // In development, use the code as mock openid
            console.log('Development mode: Using code as mock openid');
            openid = code;
        } else {
            // Production mode: Actually call WeChat API
            const appid = process.env.WECHAT_APPID;
            const secret = process.env.WECHAT_SECRET;
            const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.openid) {
                console.error('Failed to get openid:', data);
                return { success: false, error: 'Failed to authenticate with WeChat' };
            }
            openid = data.openid;
        }

        // Step 2: Find or create user account
        const findAccountQuery = `
            SELECT 
                a.account_id,
                a.account_type,
                a.profile_id,
                CASE 
                    WHEN a.profile_id IS NOT NULL THEN true
                    ELSE false
                END as has_profile
            FROM account_tab a
            WHERE a.wechat_id = $1
        `;
        
        const { rows } = await pool.query(findAccountQuery, [openid]);
        
        if (rows.length === 0) {
            // No account found, create a new one
            console.log('Creating new account for wechat_id:', openid);
            
            const client = await pool.getClient();
            try {
                await client.query('BEGIN');

                // Create new account with default type as patient
                const createAccountQuery = `
                    INSERT INTO account_tab (
                        account_type,
                        wechat_id,
                        status,
                        last_login_at
                    ) VALUES (
                        'patient',
                        $1,
                        'active',
                        CURRENT_TIMESTAMP
                    ) RETURNING account_id
                `;
                
                const { rows: [newAccount] } = await client.query(createAccountQuery, [openid]);
                
                await client.query('COMMIT');

                console.log('New account created:', newAccount.account_id);
                
                return { 
                    success: true, 
                    data: { 
                        needRegister: true, // New accounts always need registration
                        wechatId: openid,
                        accountId: newAccount.account_id,
                        accountType: 'patient'
                    }
                };
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error creating new account:', error);
                throw error;
            } finally {
                client.release();
            }
        }

        // Account exists, update last login time
        await pool.query(
            'UPDATE account_tab SET last_login_at = CURRENT_TIMESTAMP WHERE wechat_id = $1',
            [openid]
        );

        // Log the account details for debugging
        console.log('Found existing account:', {
            accountId: rows[0].account_id,
            profileId: rows[0].profile_id,
            hasProfile: rows[0].has_profile
        });

        return {
            success: true,
            data: {
                needRegister: !rows[0].has_profile, // true if no profile exists
                accountId: rows[0].account_id,
                profileId: rows[0].profile_id,
                accountType: rows[0].account_type,
                wechatId: openid
            }
        };
    } catch (error) {
        console.error('WeChat login error:', error);
        return { success: false, error: 'Login failed' };
    }
};

// Check if account has a patient profile
const checkAccountProfile = async (accountId) => {
    try {
        const query = `
            SELECT 
                a.account_id,
                a.profile_id,
                a.account_type,
                a.wechat_id,
                CASE 
                    WHEN a.profile_id IS NOT NULL THEN true
                    ELSE false
                END as has_profile
            FROM account_tab a
            WHERE a.account_id = $1
        `;

        const { rows } = await pool.query(query, [accountId]);

        if (rows.length === 0) {
            return {
                success: false,
                error: '账号不存在'
            };
        }

        return {
            success: true,
            data: {
                accountId: rows[0].account_id,
                profileId: rows[0].profile_id,
                accountType: rows[0].account_type,
                wechatId: rows[0].wechat_id,
                hasProfile: rows[0].has_profile
            }
        };
    } catch (error) {
        console.error('Error checking account profile:', error);
        return {
            success: false,
            error: '查询账号信息失败'
        };
    }
};

// Get account by WeChat ID
const getAccountByWechatId = async (wechatId) => {
  try {
    const query = `
      SELECT account_id, account_type, profile_id
      FROM account_tab
      WHERE wechat_id = $1
    `;
    
    const { rows } = await pool.query(query, [wechatId]);
    
    if (rows.length === 0) {
      return {
        success: false,
        error: '账号不存在'
      };
    }
    
    return {
      success: true,
      data: {
        accountId: rows[0].account_id,
        accountType: rows[0].account_type,
        profileId: rows[0].profile_id
      }
    };
  } catch (error) {
    console.error('Error getting account by WeChat ID:', error);
    return {
      success: false,
      error: '获取账号信息失败'
    };
  }
};

module.exports = {
    wechatLogin,
    checkAccountProfile,
    getAccountByWechatId
}; 