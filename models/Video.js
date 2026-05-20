 const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
}, { timestamps: true });

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  views: { type: Number, default: 0 },
}, { timestamps: true });

// Add to watch history
router.post('/:id/watch', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { watchHistory: req.params.id }
    });
    await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ message: 'Watch history updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get watch history
router.get('/history', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id)
      .populate({
        path: 'watchHistory',
        populate: { path: 'uploader', select: 'name' }
      });
    res.json(user.watchHistory.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = mongoose.model('Video', videoSchema);
