export default {
  // Nota bene: Ultimately, values for 'reversePattern' will be generated
  // automatically based on the respective config's 'pattern' value.
  notFound: {
    pattern: /^.+$/,
    name: 'fourohfour',
    reversePattern: '/404/',
  },
  listPage: {
    pattern: /^([\s\d\w&=\-%.]*)\/{0,1}$/,
    name: 'home',
    reversePattern: '/',
  },
  printListPage: {
    pattern: /^print\/([\s\d\w&=\-%.]*)\/{0,1}$/,
    name: 'printList',
    reversePattern: '/print/',
  },
  createPage: {
    pattern: /^edit\/{0,1}$/,
    name: 'edit',
    reversePattern: '/edit/',
  },
  editPage: {
    pattern: /^edit\/(\d+)\/{0,1}$/,
    name: 'edit',
    reversePattern: '/edit/',
  },
};
