window.CEB_GRAMMAR = {
  categories: [
    {
      name: { fr: "Actions", en: "Actions" },
      color: "#5daabd",
      blocks: [
        { type: "ceb_move",  label: { fr: "avance",        en: "move"       }, gen: "await api.move()" },
        { type: "ceb_left",  label: { fr: "tourne gauche", en: "turn left"  }, gen: "await api.turn_left()" },
        { type: "ceb_right", label: { fr: "tourne droite", en: "turn right" }, gen: "await api.turn_right()" }
      ]
    }
  ]
};