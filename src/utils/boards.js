import cli from './arduino-exec';

const boards = {

  // Print details about a board.
  details: async (fqbn = '', socket, done) => {
    const res = await cli('board.details', [fqbn], socket, { emit: false });
    const response = JSON.parse(res);
    if (done) done(response);
    return response;
  },

  // List connected boards.
  list: async (socket, done) => {
    const res = await cli('board.list', [], socket, { emit: false });
    const response = JSON.parse(res);
    if (done) done(response);
    return response;
  },

  // List all known boards and their corresponding FQBN.
  listall: async (socket, done) => {
    const res = await cli('board.listall', [], socket);
    const response = JSON.parse(res);
    await Promise.all(response.boards.map(async (board) => {
      // eslint-disable-next-line no-param-reassign
      board.options = (await boards.details(board.fqbn, socket)).ConfigOptions;
    }));
    if (done) done(response);
    return response;
  },
};

export default boards;
