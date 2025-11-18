const express = require('express');
const router = express.Router();
const FaucetService = require('../services/core/FaucetService');
const { formatTimeRemaining } = require('../utils/timeFormatter');

const faucetService = new FaucetService();

/**
 * @swagger
 * /api/faucet/claim:
 *   post:
 *     summary: Claim tokens from the faucet
 *     description: Allows a user to claim test tokens from the faucet.
 *     tags:
 *       - Faucet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userAddress
 *             properties:
 *               userAddress:
 *                 type: string
 *                 description: The Aptos address of the user claiming tokens.
 *     responses:
 *       200:
 *         description: Tokens claimed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionHash:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     amountOctas:
 *                       type: number
 *                     recipient:
 *                       type: string
 *                     nextClaimTime:
 *                       type: string
 *                     message:
 *                       type: string
 *       400:
 *         description: Bad request, e.g., missing or invalid user address.
 *       500:
 *         description: Internal server error.
 */
router.post('/claim', async (req, res) => {
  try {
    const { userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }

    // Validate address format
    if (!faucetService.isValidAddress(userAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    console.log(`🚰 API: Claim request for user: ${userAddress}`);

    // Server claims tokens and transfers to user
    const result = await faucetService.claimTokensForUser(userAddress);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ API Error claiming tokens:', error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.statusCode ? error.message : 'Failed to claim tokens';
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @swagger
 * /api/faucet/info/{userAddress}:
 *   get:
 *     summary: Get faucet information for a specific user
 *     description: Retrieves details about a user's faucet claim status, including cooldown and next claim time.
 *     tags:
 *       - Faucet
 *     parameters:
 *       - in: path
 *         name: userAddress
 *         schema:
 *           type: string
 *         required: true
 *         description: The Aptos address of the user.
 *     responses:
 *       200:
 *         description: Faucet information retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     faucetAmount:
 *                       type: number
 *                     cooldownHours:
 *                       type: number
 *                     canClaim:
 *                       type: boolean
 *                     lastClaimTime:
 *                       type: string
 *                       nullable: true
 *                     nextClaimTime:
 *                       type: string
 *                       nullable: true
 *                     timeRemaining:
 *                       type: string
 *       400:
 *         description: Bad request, e.g., invalid user address format.
 *       500:
 *         description: Internal server error.
 */
router.get('/info/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;

    if (!faucetService.isValidAddress(userAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    const faucetInfo = await faucetService.getFaucetInfo(userAddress);
    const countdown = await faucetService.getClaimCountdown(userAddress);

    res.json({
      success: true,
      data: {
        ...faucetInfo,
        ...countdown,
        timeRemaining: formatTimeRemaining(countdown.timeUntilNextClaim)
      }
    });

  } catch (error) {
    console.error('❌ API Error getting faucet info:', error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.statusCode ? error.message : 'Failed to get faucet info';
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @swagger
 * /api/faucet/stats:
 *   get:
 *     summary: Get faucet statistics
 *     description: Retrieves overall statistics for the faucet, including total claims, distribution, and server wallet info.
 *     tags:
 *       - Faucet
 *     responses:
 *       200:
 *         description: Faucet statistics retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRequests:
 *                       type: number
 *                     last24Hours:
 *                       type: number
 *                     last7Days:
 *                       type: number
 *                     totalDistributed:
 *                       type: number
 *                     faucetAmount:
 *                       type: number
 *                     cooldownHours:
 *                       type: number
 *                     server:
 *                       type: object
 *                       properties:
 *                         address:
 *                           type: string
 *                         balance:
 *                           type: number
 *                           nullable: true
 *                         balanceAPT:
 *                           type: number
 *                           nullable: true
 *                         status:
 *                           type: string
 *       500:
 *         description: Internal server error.
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await faucetService.getFaucetStats();
    const serverInfo = await faucetService.getServerWalletInfo();

    res.json({
      success: true,
      data: {
        ...stats,
        server: serverInfo
      }
    });

  } catch (error) {
    console.error('❌ API Error getting faucet stats:', error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.statusCode ? error.message : 'Failed to get faucet stats';
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @swagger
 * /api/faucet/server-info:
 *   get:
 *     summary: Get faucet server wallet information
 *     description: Retrieves information about the faucet's server wallet, including its address and balance.
 *     tags:
 *       - Faucet
 *     responses:
 *       200:
 *         description: Server wallet information retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                     balance:
 *                       type: number
 *                       nullable: true
 *                     balanceAPT:
 *                       type: number
 *                       nullable: true
 *                     status:
 *                       type: string
 *       500:
 *         description: Internal server error.
 */
router.get('/server-info', async (req, res) => {
  try {
    const serverInfo = await faucetService.getServerWalletInfo();

    res.json({
      success: true,
      data: serverInfo
    });

  } catch (error) {
    console.error('❌ API Error getting server info:', error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.statusCode ? error.message : 'Failed to get server info';
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @swagger
 * /api/faucet/status:
 *   get:
 *     summary: Get faucet service status
 *     description: Retrieves the current operational status of the faucet service for debugging purposes.
 *     tags:
 *       - Faucet
 *     responses:
 *       200:
 *         description: Faucet service status retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: The status object of the faucet service.
 *       500:
 *         description: Internal server error.
 */
router.get('/status', async (req, res) => {
  try {
    const status = faucetService.getServiceStatus();

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ API Error getting service status:', error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.statusCode ? error.message : 'Failed to get service status';
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
});

module.exports = router;
