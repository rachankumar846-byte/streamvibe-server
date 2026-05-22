const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const auth = require('../middleware/auth');
const { cloudinary, upload } = require('../config/cloudinary');

// Get all videos
router.get('/', auth, async (req, res) => {
  try {
    const videos = await Video.find()
      .populate('uploader', 'name')
      .sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    console.log('Get videos error:', err.message);
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
});

// Upload video
router.post('/', auth, upload.single('video'), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('File:', req.file);
    console.log('Body:', req.body);

    const { title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const video = await Video.create({
      title,
      description,
      videoUrl: req.file.path,
      thumbnail: req.file.path
  .replace('/upload/', '/upload/so_0,w_400,h_250,c_fill/')
  .replace('.mp4', '.jpg')
  .replace('.mov', '.jpg')
  .replace('.avi', '.jpg'),
      uploader: req.user.id,
    });

    console.log('Video created:', video._id);
    res.status(201).json(video);
  } catch (err) {
    console.log('Upload error:', err.message);
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
});

// Increment views
router.put('/:id/view', auth, async (req, res) => {
  try {
    await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ message: 'View counted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

// Delete video
router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    if (video.uploader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const publicId = video.videoUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`streamvibe/${publicId}`, { resource_type: 'video' });

    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;