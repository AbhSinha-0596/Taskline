class ImportantContact {
  final String name;
  final String category; // "family" | "office" | "friends" | "others"

  ImportantContact({
    required this.name,
    required this.category,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'category': category,
    };
  }

  factory ImportantContact.fromJson(Map<String, dynamic> json) {
    return ImportantContact(
      name: json['name'] as String,
      category: json['category'] as String,
    );
  }
}
