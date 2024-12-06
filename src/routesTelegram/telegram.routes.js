const express = require('express');
const verifyTelegramHash = require('../middleware/verifyTelegramHash');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');

module.exports = (db) => {
    // Invite validation and tracking functions
    const validateInviteCode = (inviteCode) => {
        try {
            const invites = db.get('invites').value() || [];
            const validInvite = invites.find(invite => invite.code === String(inviteCode)); // Chuyển đổi inviteCode thành số
            return validInvite || null;
        } catch (error) {
            console.error('Error validating invite code:', error);
            return null;
        }
    };
   // New function to handle token claims
   const processClaim = (userId) => {
    try {
        const members = db.get('member').value() || [];
        const memberIndex = members.findIndex(m => m.user_id === userId);

        if (memberIndex === -1) {
            return { success: false, message: 'User not found' };
        }

        const member = members[memberIndex];
        const currentTime = new Date();
        const lastClaimTime = member.lastClaim ? new Date(member.lastClaim) : null;
   
        // Check if user can claim (4 hours between claims)
        if (lastClaimTime) {
            const hoursSinceLastClaim = (currentTime - lastClaimTime) / (1000 * 60 * 60);
            
            if (hoursSinceLastClaim < 4) {
                return {
                    success: false, 
                    message: `Please wait ${(4 - hoursSinceLastClaim).toFixed(1)} hours before claiming again`,
                    remainingTime: 4 - hoursSinceLastClaim
                };
            }
        }

        // Claim reward (let's say 50 tokens)
        const claimAmount = 50;
        members[memberIndex].token = (member.token || 0) + claimAmount;
        members[memberIndex].lastClaim = currentTime.toISOString();

        db.set('member', members).write();

        return {
            success: true, 
            message: `Successfully claimed ${claimAmount} tokens!`,
            newTokenBalance: members[memberIndex].token
        };
    } catch (error) {
        console.error('Error processing claim:', error);
        return { success: false, message: 'Error processing claim' };
    }
};

    const updateInviteUsage = (inviteCode, newUser) => {
        try {
            const invites = db.get('invites').value() || [];
            const inviteIndex = invites.findIndex(invite => invite.code === String(inviteCode)); // Chuyển đổi inviteCode thành số

            if (inviteIndex !== -1) {
                const hasBeenUsedBefore =
                    invites[inviteIndex].usedBy &&
                    invites[inviteIndex].usedBy.some(use => use.userId === newUser.user_id);

                if (!hasBeenUsedBefore) {
                    if (!invites[inviteIndex].usedBy) {
                        invites[inviteIndex].usedBy = [];
                    }

                    invites[inviteIndex].usedBy.push({
                        userId: newUser.user_id,
                        username: newUser.username,
                        usedAt: new Date().toISOString()
                    });

                    invites[inviteIndex].totalUses = (invites[inviteIndex].totalUses || 0) + 1;

                    db.set('invites', invites).write();
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error updating invite usage:', error);
            return false;
        }
    };

    router.post('/', verifyTelegramHash, (req, res) => {
        try {
            const member = req.member;
            const { start_param } = req.body || {}; // Mã lời mời
            const inviteCode = String(start_param); // Chuyển start_param thành số
            const members = db.get('member').value() || [];

            const existingMemberIndex = members.findIndex(m => m.user_id === member.user_id);

            // Validate invite nếu tồn tại
            let inviteDetails = null;
            if (start_param) {
                inviteDetails = validateInviteCode(inviteCode);
            }

            if (existingMemberIndex !== -1) {
                const existingMember = members[existingMemberIndex];

                members[existingMemberIndex] = {
                    ...existingMember,
                    first_name: member.first_name || existingMember.first_name,
                    last_name: member.last_name || existingMember.last_name,
                    username: member.username || existingMember.username,
                    languageCode: member.languageCode || existingMember.languageCode,
                    photoUrl: member.photoUrl || existingMember.photoUrl,
                    token: existingMember.token || 100,
                    lastAuthenticated: new Date().toISOString(),
                    inviter: existingMember.inviter === "null" ? inviteCode : existingMember.inviter, // Chỉ cập nhật nếu chưa có inviter
                    address: existingMember.address || "null",
                    lastClaim: existingMember.lastClaim || "null"
                };

                db.set('member', members).write();

                member.token = existingMember.token || 100;
                member.inviter = members[existingMemberIndex].inviter;
                member.address = members[existingMemberIndex].address;
                member.lastClaim = members[existingMemberIndex].lastClaim;
            } else {
                const newMemberData = {
                    ...member,
                    createdAt: new Date().toISOString(),
                    lastAuthenticated: new Date().toISOString(),
                    inviter: inviteCode || null,
                    token: 100
                    
                };

                members.push(newMemberData);
                db.set('member', members).write();

                if (inviteCode) {
                    updateInviteUsage(inviteCode, newMemberData);
                }

                member.inviter = newMemberData.inviter;
                member.token = newMemberData.token;
                member.address = newMemberData.address;
                member.createdAt = newMemberData.createdAt;
                member.referralSource = newMemberData.referralSource;
                member.lastClaim = newMemberData.lastClaim;
            }

            const token = jwt.sign(
                {
                    id: member.id,
                    user_id: member.user_id,
                    username: member.username
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({
                success: true,
                message: 'true',
                member: {
                    ...member,
                    lastClaim: member.lastClaim || null  // Thêm lastClaim vào phản hồi
                },
                token: token
            });
        } catch (error) {
            console.error('Chi tiết lỗi khi lưu thông tin member:', error);
            res.status(500).json({
                success: false,
                error: 'Lỗi khi lưu thông tin thành viên',
                errorDetails: error.message
            });
        }
    });
    router.post('/user/claim', verifyTelegramHash, (req, res) => {
        try {
            const member = req.member;
            const claimResult = processClaim(member.user_id);

            if (claimResult.success) {
                res.json({
                    success: true,
                    message: claimResult.message,
                    tokenBalance: claimResult.newTokenBalance
                });
            } else {
                res.status(400).json(claimResult);
            }
        } catch (error) {
            console.error('Claim error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during claim'
            });
        }
    });

    return router;
};
