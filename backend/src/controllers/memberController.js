const memberService = require('../services/memberService');

class MemberController {
  async getAll(req, res, next) {
    try {
      const members = await memberService.getAllMembers();
      res.json(members);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { name, email, avatarUrl } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }
      if (!email || typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ error: 'Email is required' });
      }
      const member = await memberService.createMember(name.trim(), email.trim().toLowerCase(), avatarUrl);
      res.status(201).json(member);
    } catch (err) {
      // Check if email unique constraint violation
      if (err.message && err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const success = await memberService.deleteMember(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Member not found' });
      }
      res.json({ message: 'Member deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MemberController();
