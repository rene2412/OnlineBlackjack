cmake_minimum_required(VERSION 3.14)
project(HelloServer)

set(CMAKE_CXX_STANDARD 17)

find_package(Drogon REQUIRED)

add_executable(hello_server src/main.cpp src/deck.cpp src/game.cpp)
target_link_libraries(hello_server PRIVATE Drogon::Drogon)

