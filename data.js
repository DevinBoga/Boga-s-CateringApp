const DEFAULT_DATA = {
  nextOfferNumber: 1000,
  business: {
    name: "Boga's MEETBAR",
    address: "Neu - Dannenberger Str 30\n28879 Grasberg\nDeutschland",
    phone: "+49 15120433597",
    email: "meet@bogas-meetbar.de",
    web: "www.bogas-meetbar.de"
  },
  categories: [
    { id:'salate', name:'Salate & Co.', maxRules:3, items:[
      {id:'salatkomponenten', name:'Salat Komponenten', type:'components', priceMode:'included', rules:[0,0,0], components:[
        {name:'Gurken', grams:25}, {name:'Kirschtomaten', grams:25}, {name:'Paprika', grams:25}, {name:'Mais', grams:10}, {name:'Zwiebeln', grams:10}, {name:'Wildkräutersalat', grams:10}
      ]},
      {id:'gurkensalat', name:'Gurkensalat', type:'simple', priceMode:'included', rules:[100,60,40]},
      {id:'moehrensalat', name:'Möhrensalat', type:'simple', priceMode:'included', rules:[80,40,30]}
    ]},
    { id:'fleisch', name:'Fleisch', maxRules:5, items:[
      {id:'nackensteak', name:'Nackensteak', type:'simple', priceMode:'included', rules:[360,180,120,90,60]},
      {id:'haehnchenspiesse', name:'Hähnchenspieße in Kräuterbutter Marinade', type:'simple', priceMode:'included', rules:[360,180,120,90,60]},
      {id:'bratwurst', name:'Bratwurst', type:'simple', priceMode:'included', rules:[350,180,100,70,60]}
    ]},
    { id:'beilagen', name:'Beilagen', maxRules:3, items:[
      {id:'pommes', name:'Pommes', type:'simple', priceMode:'included', rules:[300,150,100]},
      {id:'kroketten', name:'Kroketten', type:'simple', priceMode:'included', rules:[300,150,100]}
    ]},
    { id:'dessert', name:'Dessert', maxRules:3, items:[
      {id:'panna-cotta', name:'Panna Cotta', type:'portion', unit:'Portionen', priceMode:'included', rules:[1.1,0.55,0.35]}
    ]}
  ],
  requirements: [
    '1 Separat abgesicherte Schuko-Leitung','2 Separat abgesicherte Schuko-Leitung','1 Starkstrom Anschluss 16A','1 Starkstrom Anschluss 32A','1 Wasserleitung','1 Abwasserleitung (Gulli etc.)','1 Zapfstelle für 10-20L Frischwasser','1 Entsorgungsmöglichkeit für 10-20L Abwasser','Müllentsorgung vor Ort'
  ]
};
