 const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const auth = require('../middleware/auth');

// Get all videos
router.get('/', auth, async (req, res) => {
  try {
    const videos = await Video.find()
      .populate('uploader', 'name')
      .sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search videos
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    const videos = await Video.find({
      title: { $regex: q, $options: 'i' }
    }).populate('uploader', 'name');
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload video
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnail } = req.body;
    const video = await Video.create({
      title, description, videoUrl, thumbnail,
      uploader: req.user.id,
    });
    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Like video
router.post('/:id/like', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    const liked = video.likes.includes(req.user.id);
    if (liked) {
      video.likes = video.likes.filter(id => id.toString() !== req.user.id);
    } else {
      video.likes.push(req.user.id);
    }
    await video.save();
    res.json({ likes: video.likes.length, liked: !liked });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    video.comments.push({ user: req.user.id, text: req.body.text });
    await video.save();
    res.json(video.comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Increment views
router.put('/:id/view', auth, async (req, res) => {
  try {
    await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ message: 'View counted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
