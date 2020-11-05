export default {
  title: 'default',
  data: [
    {
      colNumber: '1',
      colTitle: 'To do',
      tracking: 'to-do',
      cards: [{
        cardNumber: '6',
        cardText:
        'Default Task'
      }]
    },
    {
      colNumber: '2',
      colTitle: 'In Progress',
      tracking: 'in-progress',
      cards: []
    },
    {
      colNumber: '3',
      colTitle: 'Done',
      tracking: 'done',
      cards: []
    },
    {
      colNumber: '4',
      colTitle: 'Trash',
      tracking: 'trash',
      cards: []
    }
  ],
  runningColCount: 4
}
