const db = require('../config/database');

class MemberService {
  async getAllMembers() {
    return await db.all('SELECT * FROM members ORDER BY name ASC');
  }

  async getMemberById(id) {
    return await db.get('SELECT * FROM members WHERE id = ?', [id]);
  }

  async createMember(name, email, avatarUrl) {
    const defaultAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
    const { id } = await db.run(
      'INSERT INTO members (name, email, avatar_url) VALUES (?, ?, ?)',
      [name, email, avatarUrl || defaultAvatar]
    );
    return await this.getMemberById(id);
  }

  async deleteMember(id) {
    const member = await this.getMemberById(id);
    if (!member) return false;
    await db.run('DELETE FROM members WHERE id = ?', [id]);
    return true;
  }
}

module.exports = new MemberService();
