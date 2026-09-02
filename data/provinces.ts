export type Region =
    | "Marmara"
    | "Ege"
    | "Akdeniz"
    | "İç Anadolu"
    | "Karadeniz"
    | "Doğu Anadolu"
    | "Güneydoğu Anadolu";

export type Province = {
    plate: number;
    name: string;
    region: Region;
    neighbors: string[];
};

export const provinces: Province[] = [
    {
        plate: 1,
        name: "Adana",
        region: "Akdeniz",
        neighbors: ["Mersin", "Niğde", "Kayseri", "Kahramanmaraş", "Osmaniye", "Hatay"]
    },
    {
        plate: 2,
        name: "Adıyaman",
        region: "Güneydoğu Anadolu",
        neighbors: ["Malatya", "Kahramanmaraş", "Gaziantep", "Şanlıurfa", "Diyarbakır"]
    },
    {
        plate: 3,
        name: "Afyonkarahisar",
        region: "Ege",
        neighbors: ["Uşak", "Denizli", "Burdur", "Isparta", "Konya", "Eskişehir", "Kütahya"]
    },
    {
        plate: 4, name: "Ağrı", region: "Doğu Anadolu", neighbors: ["Erzurum", "Kars", "Iğdır", "Van", "Bitlis", "Muş"]
    },
    {plate: 5, name: "Amasya", region: "Karadeniz", neighbors: ["Samsun", "Tokat", "Yozgat", "Çorum"]},
    {
        plate: 6,
        name: "Ankara",
        region: "İç Anadolu",
        neighbors: ["Bolu", "Çankırı", "Kırıkkale", "Kırşehir", "Aksaray", "Konya", "Eskişehir"]
    },
    {
        plate: 7,
        name: "Antalya",
        region: "Akdeniz",
        neighbors: ["Muğla", "Burdur", "Isparta", "Konya", "Karaman", "Mersin"]
    },
    {plate: 8, name: "Artvin", region: "Karadeniz", neighbors: ["Rize", "Erzurum", "Ardahan"]},
    {plate: 9, name: "Aydın", region: "Ege", neighbors: ["İzmir", "Manisa", "Denizli", "Muğla"]},
    {plate: 10, name: "Balıkesir", region: "Marmara", neighbors: ["Çanakkale", "Bursa", "Kütahya", "Manisa", "İzmir"]},
    {plate: 11, name: "Bilecik", region: "Marmara", neighbors: ["Bursa", "Kütahya", "Eskişehir", "Bolu", "Sakarya"]},
    {
        plate: 12,
        name: "Bingöl",
        region: "Doğu Anadolu",
        neighbors: ["Erzurum", "Muş", "Diyarbakır", "Elazığ", "Tunceli", "Erzincan"]
    },
    {plate: 13, name: "Bitlis", region: "Doğu Anadolu", neighbors: ["Ağrı", "Muş", "Batman", "Siirt", "Van"]},
    {
        plate: 14,
        name: "Bolu",
        region: "Karadeniz",
        neighbors: ["Düzce", "Zonguldak", "Karabük", "Çankırı", "Ankara", "Eskişehir", "Bilecik", "Sakarya"]
    },
    {
        plate: 15,
        name: "Burdur",
        region: "Akdeniz",
        neighbors: ["Muğla", "Denizli", "Afyonkarahisar", "Isparta", "Antalya"]
    },
    {
        plate: 16,
        name: "Bursa",
        region: "Marmara",
        neighbors: ["Balıkesir", "Kütahya", "Bilecik", "Sakarya", "Kocaeli", "Yalova"]
    },
    {plate: 17, name: "Çanakkale", region: "Marmara", neighbors: ["Balıkesir", "Tekirdağ", "Edirne"]},
    {
        plate: 18,
        name: "Çankırı",
        region: "İç Anadolu",
        neighbors: ["Bolu", "Karabük", "Kastamonu", "Çorum", "Kırıkkale", "Ankara"]
    },
    {
        plate: 19,
        name: "Çorum",
        region: "Karadeniz",
        neighbors: ["Kastamonu", "Sinop", "Samsun", "Amasya", "Yozgat", "Kırıkkale", "Çankırı"]
    },
    {
        plate: 20,
        name: "Denizli",
        region: "Ege",
        neighbors: ["Aydın", "Manisa", "Uşak", "Afyonkarahisar", "Burdur", "Muğla"]
    },
    {
        plate: 21,
        name: "Diyarbakır",
        region: "Güneydoğu Anadolu",
        neighbors: ["Şanlıurfa", "Mardin", "Batman", "Muş", "Bingöl", "Elazığ", "Malatya", "Adıyaman"]
    },
    {plate: 22, name: "Edirne", region: "Marmara", neighbors: ["Kırklareli", "Tekirdağ", "Çanakkale"]},
    {plate: 23, name: "Elazığ", region: "Doğu Anadolu", neighbors: ["Malatya", "Tunceli", "Bingöl", "Diyarbakır"]},
    {
        plate: 24,
        name: "Erzincan",
        region: "Doğu Anadolu",
        neighbors: ["Sivas", "Giresun", "Gümüşhane", "Bayburt", "Erzurum", "Bingöl", "Tunceli", "Elazığ", "Malatya"]
    },
    {
        plate: 25,
        name: "Erzurum",
        region: "Doğu Anadolu",
        neighbors: ["Erzincan", "Bayburt", "Rize", "Artvin", "Ardahan", "Kars", "Ağrı", "Muş", "Bingöl"]
    },
    {
        plate: 26,
        name: "Eskişehir",
        region: "İç Anadolu",
        neighbors: ["Bilecik", "Bolu", "Ankara", "Konya", "Afyonkarahisar", "Kütahya"]
    },
    {
        plate: 27,
        name: "Gaziantep",
        region: "Güneydoğu Anadolu",
        neighbors: ["Hatay", "Osmaniye", "Kahramanmaraş", "Adıyaman", "Şanlıurfa", "Kilis"]
    },
    {plate: 28, name: "Giresun", region: "Karadeniz", neighbors: ["Ordu", "Sivas", "Erzincan", "Gümüşhane", "Trabzon"]},
    {plate: 29, name: "Gümüşhane", region: "Karadeniz", neighbors: ["Giresun", "Trabzon", "Bayburt", "Erzincan"]},
    {plate: 30, name: "Hakkari", region: "Doğu Anadolu", neighbors: ["Van", "Şırnak"]},
    {plate: 31, name: "Hatay", region: "Akdeniz", neighbors: ["Adana", "Osmaniye", "Gaziantep", "Kilis"]},
    {plate: 32, name: "Isparta", region: "Akdeniz", neighbors: ["Burdur", "Afyonkarahisar", "Konya", "Antalya"]},
    {plate: 33, name: "Mersin", region: "Akdeniz", neighbors: ["Antalya", "Karaman", "Konya", "Niğde", "Adana"]},
    {plate: 34, name: "İstanbul", region: "Marmara", neighbors: ["Tekirdağ", "Kırklareli", "Kocaeli"]},
    {plate: 35, name: "İzmir", region: "Ege", neighbors: ["Balıkesir", "Manisa", "Aydın"]},
    {plate: 36, name: "Kars", region: "Doğu Anadolu", neighbors: ["Erzurum", "Ardahan", "Iğdır", "Ağrı"]},
    {plate: 37, name: "Kastamonu", region: "Karadeniz", neighbors: ["Sinop", "Çorum", "Çankırı", "Karabük", "Bartın"]},
    {
        plate: 38,
        name: "Kayseri",
        region: "İç Anadolu",
        neighbors: ["Sivas", "Kahramanmaraş", "Adana", "Niğde", "Nevşehir", "Yozgat"]
    },
    {plate: 39, name: "Kırklareli", region: "Marmara", neighbors: ["Edirne", "Tekirdağ", "İstanbul"]},
    {
        plate: 40,
        name: "Kırşehir",
        region: "İç Anadolu",
        neighbors: ["Ankara", "Kırıkkale", "Yozgat", "Nevşehir", "Aksaray"]
    },
    {plate: 41, name: "Kocaeli", region: "Marmara", neighbors: ["İstanbul", "Sakarya", "Bursa", "Yalova"]},
    {
        plate: 42,
        name: "Konya",
        region: "İç Anadolu",
        neighbors: ["Ankara", "Eskişehir", "Afyonkarahisar", "Isparta", "Antalya", "Karaman", "Mersin", "Niğde", "Aksaray"]
    },
    {
        plate: 43,
        name: "Kütahya",
        region: "Ege",
        neighbors: ["Balıkesir", "Bursa", "Bilecik", "Eskişehir", "Afyonkarahisar", "Uşak", "Manisa"]
    },
    {
        plate: 44,
        name: "Malatya",
        region: "Doğu Anadolu",
        neighbors: ["Sivas", "Erzincan", "Elazığ", "Diyarbakır", "Adıyaman", "Kahramanmaraş"]
    },
    {
        plate: 45,
        name: "Manisa",
        region: "Ege",
        neighbors: ["Balıkesir", "Kütahya", "Uşak", "Denizli", "Aydın", "İzmir"]
    },
    {
        plate: 46,
        name: "Kahramanmaraş",
        region: "Akdeniz",
        neighbors: ["Adana", "Osmaniye", "Gaziantep", "Adıyaman", "Malatya", "Sivas", "Kayseri"]
    },
    {
        plate: 47,
        name: "Mardin",
        region: "Güneydoğu Anadolu",
        neighbors: ["Şanlıurfa", "Diyarbakır", "Batman", "Siirt", "Şırnak"]
    },
    {plate: 48, name: "Muğla", region: "Ege", neighbors: ["Aydın", "Denizli", "Burdur", "Antalya"]},
    {
        plate: 49,
        name: "Muş",
        region: "Doğu Anadolu",
        neighbors: ["Erzurum", "Ağrı", "Bitlis", "Batman", "Diyarbakır", "Bingöl"]
    },
    {
        plate: 50,
        name: "Nevşehir",
        region: "İç Anadolu",
        neighbors: ["Kırşehir", "Yozgat", "Kayseri", "Niğde", "Aksaray"]
    },
    {
        plate: 51,
        name: "Niğde",
        region: "İç Anadolu",
        neighbors: ["Aksaray", "Nevşehir", "Kayseri", "Adana", "Mersin", "Konya"]
    },
    {plate: 52, name: "Ordu", region: "Karadeniz", neighbors: ["Samsun", "Tokat", "Sivas", "Giresun"]},
    {plate: 53, name: "Rize", region: "Karadeniz", neighbors: ["Trabzon", "Bayburt", "Erzurum", "Artvin"]},
    {plate: 54, name: "Sakarya", region: "Marmara", neighbors: ["Kocaeli", "Bursa", "Bilecik", "Bolu", "Düzce"]},
    {plate: 55, name: "Samsun", region: "Karadeniz", neighbors: ["Sinop", "Çorum", "Amasya", "Tokat", "Ordu"]},
    {plate: 56, name: "Siirt", region: "Güneydoğu Anadolu", neighbors: ["Batman", "Bitlis", "Van", "Şırnak", "Mardin"]},
    {plate: 57, name: "Sinop", region: "Karadeniz", neighbors: ["Kastamonu", "Çorum", "Samsun"]},
    {
        plate: 58,
        name: "Sivas",
        region: "İç Anadolu",
        neighbors: ["Yozgat", "Kayseri", "Kahramanmaraş", "Malatya", "Erzincan", "Giresun", "Ordu", "Tokat"]
    },
    {plate: 59, name: "Tekirdağ", region: "Marmara", neighbors: ["Edirne", "Kırklareli", "İstanbul", "Çanakkale"]},
    {plate: 60, name: "Tokat", region: "Karadeniz", neighbors: ["Amasya", "Samsun", "Ordu", "Sivas", "Yozgat"]},
    {plate: 61, name: "Trabzon", region: "Karadeniz", neighbors: ["Giresun", "Gümüşhane", "Bayburt", "Rize"]},
    {plate: 62, name: "Tunceli", region: "Doğu Anadolu", neighbors: ["Erzincan", "Bingöl", "Elazığ"]},
    {
        plate: 63,
        name: "Şanlıurfa",
        region: "Güneydoğu Anadolu",
        neighbors: ["Gaziantep", "Adıyaman", "Diyarbakır", "Mardin"]
    },
    {plate: 64, name: "Uşak", region: "Ege", neighbors: ["Manisa", "Kütahya", "Afyonkarahisar", "Denizli"]},
    {plate: 65, name: "Van", region: "Doğu Anadolu", neighbors: ["Ağrı", "Bitlis", "Siirt", "Şırnak", "Hakkari"]},
    {
        plate: 66,
        name: "Yozgat",
        region: "İç Anadolu",
        neighbors: ["Çorum", "Amasya", "Tokat", "Sivas", "Kayseri", "Nevşehir", "Kırşehir", "Kırıkkale"]
    },
    {plate: 67, name: "Zonguldak", region: "Karadeniz", neighbors: ["Düzce", "Bolu", "Karabük", "Bartın"]},
    {plate: 68, name: "Aksaray", region: "İç Anadolu", neighbors: ["Ankara", "Kırşehir", "Nevşehir", "Niğde", "Konya"]},
    {
        plate: 69,
        name: "Bayburt",
        region: "Karadeniz",
        neighbors: ["Gümüşhane", "Trabzon", "Rize", "Erzurum", "Erzincan"]
    },
    {plate: 70, name: "Karaman", region: "İç Anadolu", neighbors: ["Konya", "Mersin", "Antalya"]},
    {
        plate: 71,
        name: "Kırıkkale",
        region: "İç Anadolu",
        neighbors: ["Ankara", "Çankırı", "Çorum", "Yozgat", "Kırşehir"]
    },
    {
        plate: 72,
        name: "Batman",
        region: "Güneydoğu Anadolu",
        neighbors: ["Diyarbakır", "Muş", "Bitlis", "Siirt", "Mardin"]
    },
    {plate: 73, name: "Şırnak", region: "Güneydoğu Anadolu", neighbors: ["Mardin", "Siirt", "Van", "Hakkari"]},
    {plate: 74, name: "Bartın", region: "Karadeniz", neighbors: ["Zonguldak", "Karabük", "Kastamonu"]},
    {plate: 75, name: "Ardahan", region: "Doğu Anadolu", neighbors: ["Artvin", "Erzurum", "Kars"]},
    {plate: 76, name: "Iğdır", region: "Doğu Anadolu", neighbors: ["Kars", "Ağrı"]},
    {plate: 77, name: "Yalova", region: "Marmara", neighbors: ["Kocaeli", "Bursa"]},
    {
        plate: 78,
        name: "Karabük",
        region: "Karadeniz",
        neighbors: ["Zonguldak", "Bartın", "Kastamonu", "Çankırı", "Bolu"]
    },
    {plate: 79, name: "Kilis", region: "Güneydoğu Anadolu", neighbors: ["Gaziantep", "Hatay"]},
    {plate: 80, name: "Osmaniye", region: "Akdeniz", neighbors: ["Adana", "Hatay", "Gaziantep", "Kahramanmaraş"]},
    {plate: 81, name: "Düzce", region: "Karadeniz", neighbors: ["Zonguldak", "Bolu", "Sakarya"]},
];
