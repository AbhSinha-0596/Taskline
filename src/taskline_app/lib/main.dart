import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/dashboard_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const TasklineApp());
}

class TasklineApp extends StatefulWidget {
  const TasklineApp({Key? key}) : super(key: key);

  @override
  _TasklineAppState createState() => _TasklineAppState();
}

class _TasklineAppState extends State<TasklineApp> {
  ThemeMode _themeMode = ThemeMode.dark;

  @override
  void initState() {
    super.initState();
    _loadThemeMode();
  }

  Future<void> _loadThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    final mode = prefs.getString('displayMode') ?? "dark";
    setState(() {
      if (mode == "light") {
        _themeMode = ThemeMode.light;
      } else if (mode == "dark") {
        _themeMode = ThemeMode.dark;
      } else {
        _themeMode = ThemeMode.system;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TASKLINE APP',
      debugShowCheckedModeBanner: false,
      
      // 1. LIGHT THEME CONFIGURATION
      theme: ThemeData(
        brightness: Brightness.light,
        primarySwatch: Colors.amber,
        scaffoldBackgroundColor: Colors.grey.shade50,
        cardColor: Colors.white,
        fontFamily: 'sans-serif',
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.amber,
          foregroundColor: Colors.black,
          elevation: 0,
        ),
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
          focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.amber, width: 2)),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.amber,
            foregroundColor: Colors.black,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
      ),

      // 2. DARK THEME CONFIGURATION
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.amber,
        scaffoldBackgroundColor: Colors.grey.shade950,
        cardColor: Colors.grey.shade900,
        fontFamily: 'sans-serif',
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.black87,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
          focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.amber, width: 2)),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.amber,
            foregroundColor: Colors.black,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
      ),

      themeMode: _themeMode,
      home: const DashboardScreen(),
    );
  }
}
