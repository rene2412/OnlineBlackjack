cmake_minimum_required(VERSION 3.14)
project(HelloServer)

set(CMAKE_CXX_STANDARD 17)

find_package(Drogon REQUIRED)

add_executable(hello_server src/logic/main.cpp src/logic/deck.cpp src/logic/game.cpp src/controller/controller.cpp)
target_link_libraries(hello_server PRIVATE Drogon::Drogon)

