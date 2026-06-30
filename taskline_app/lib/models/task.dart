class Task {
  final String id;
  final String title;
  final String description;
  final String category; // "project" | "task" | "travel_train" | "travel_flight" | "family_call"
  final DateTime dateTime;
  bool isCompleted;
  
  // Optional parameters matching existing codebase
  final String? callerName;
  final String? callerRole;
  final String? trainNumber;
  final String? flightNumber;
  int? delayMinutes;
  bool? hasBufferRisk;

  Task({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.dateTime,
    this.isCompleted = false,
    this.callerName,
    this.callerRole,
    this.trainNumber,
    this.flightNumber,
    this.delayMinutes = 0,
    this.hasBufferRisk = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'dateTime': dateTime.toIso8601String(),
      'isCompleted': isCompleted,
      'callerName': callerName,
      'callerRole': callerRole,
      'trainNumber': trainNumber,
      'flightNumber': flightNumber,
      'delayMinutes': delayMinutes,
      'hasBufferRisk': hasBufferRisk,
    };
  }

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      category: json['category'] as String,
      dateTime: DateTime.parse(json['dateTime'] as String),
      isCompleted: json['isCompleted'] as bool? ?? false,
      callerName: json['callerName'] as String?,
      callerRole: json['callerRole'] as String?,
      trainNumber: json['trainNumber'] as String?,
      flightNumber: json['flightNumber'] as String?,
      delayMinutes: json['delayMinutes'] as int? ?? 0,
      hasBufferRisk: json['hasBufferRisk'] as bool? ?? false,
    );
  }
}
