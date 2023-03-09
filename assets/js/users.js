class Users {
  constructor() {
    this.users = [];
  }

  /**
   * Creates and returns a new user.
   * @constructor
   * @param {String} id - the user's socket id
   * @param {String} name - the user's name
   * @param {String} room - the name of the room
   */
  addUser(id, name, room) {
    let user = {id, name, room};
    this.users.push(user);
    return user;
  }

  /**
   * Returns an array of all users in the room.
   * @param {String} room - the name of the room
   */
  getUserList (room) {
    let users = this.users.filter((user) => user.room === room);
    let namesArray = users.map((user) => user.name);
    return namesArray;
  }

   /**
   * Returns a unique user from user socket id search.
   * @param {String} id - the user's socket id
   */
  getUser(id) {
    return this.users.filter((user) => user.id === id)[0];
  }

  /**
   * Returns a unique user from user name search.
   * @param {String} name - the user's user name
   */
  getUserFromName(name) {
    return this.users.filter((user) => user.name == name)[0];
  }

  /**
   * Removes and returns the selected user.
   * @param {String} id - the user's socket id
   */
  removeUser(id) {
    let user = this.getUser(id);

    if(user){
      this.users = this.users.filter((user) => user.id !== id);
    }

    return user;
  }

}

module.exports = {Users};
