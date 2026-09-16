import { User } from '../models/User.js';

export class UserService {
  static async findUserByEmail(email) {
    return await User.findOne({ email });
  }

  static async findUserById(id) {
    return await User.findById(id);
  }
}
