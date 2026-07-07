window.DEFAULT_DATA = {
  offerStart: 1000,
  offerYear: 2026,
  company: {
    logoText: "Boga's MEETBAR",
    name: "Boga's MEETBAR",
    address: "Neu - Dannenberger Str 30\n28879 Grasberg\nDeutschland",
    phone: "+49 15120433597",
    email: "meet@bogas-meetbar.de",
    web: "www.bogas-meetbar.de",
    signature: "Nicole Boga"
  },
  requirements: [
    "1 Separat abgesicherte Schuko-Leitung",
    "2 Separat abgesicherte Schuko-Leitung",
    "1 Starkstrom Anschluss 16A",
    "1 Starkstrom Anschluss 32A",
    "1 Wasserleitung",
    "1 Abwasserleitung (Gulli etc.)",
    "1 Zapfstelle für 10-20L Frischwasser",
    "1 Entsorgungsmöglichkeit für 10-20L Abwasser",
    "Müllentsorgung vor Ort"
  ],
  categories: [
    {id:"salate", name:"Salate & Co.", type:"count", max:3, items:[
      {id:"salatkomponenten", name:"Salat Komponenten", components:[
        {name:"Gurken", grams:25},{name:"Kirschtomaten", grams:25},{name:"Paprika", grams:25},{name:"Mais", grams:10},{name:"Zwiebeln", grams:10},{name:"Wildkräutersalat", grams:10}
      ]},
      {id:"gurkensalat", name:"Gurkensalat", gramsByCount:{1:100,2:60,3:40}},
      {id:"moehrensalat", name:"Möhrensalat", gramsByCount:{1:80,2:40,3:40}}
    ]},
    {id:"fleisch", name:"Fleisch", type:"count", max:5, items:[
      {id:"nackensteak", name:"Nackensteak", gramsByCount:{1:360,2:180,3:120,4:90,5:60}},
      {id:"haehnchenspiesse", name:"Hähnchenspieße in Kräuterbutter Marinade", gramsByCount:{1:360,2:180,3:120,4:90,5:60}},
      {id:"bratwurst", name:"Bratwurst", gramsByCount:{1:350,2:180,3:100,4:70,5:60}}
    ]},
    {id:"beilagen", name:"Beilagen", type:"count", max:3, items:[
      {id:"pommes", name:"Pommes", gramsByCount:{1:300,2:150,3:100}},
      {id:"kroketten", name:"Kroketten", gramsByCount:{1:300,2:150,3:100}}
    ]},
    {id:"dessert", name:"Dessert", type:"count", max:3, items:[
      {id:"panna-cotta", name:"Panna Cotta", unit:"Portionen", portionsByCount:{1:1.1,2:0.55,3:0.35}}
    ]}
  ]
};
