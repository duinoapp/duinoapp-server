import cli from './arduino-exec';

const boards = {

  details: async (fqbn = '', socket, done) => {
    const res = await cli('board.details', [fqbn], socket, { emit: false });
    const response = JSON.parse(res);
    if (done) done(response);
    return response;
  },

  list: async (socket, done) => {
    const res = await cli('board.list', [], socket, { emit: false });
    const response = JSON.parse(res);
    if (done) done(response);
    return response;
  },

  listall: async (socket, done) => {
    const res = await cli('board.listall', socket);
    const response = JSON.parse(res);
    await Promise.all(response.boards.map(async (board) => {
      // eslint-disable-next-line no-param-reassign
      board.options = (await boards.details(board.fqbn)).ConfigOptions;
    }));
    if (done) done(response);
    return response;
  },
};

export default boards;
