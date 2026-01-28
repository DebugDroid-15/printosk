cmake_minimum_required(VERSION 3.13)

# Initialize the Raspberry Pi Pico SDK
include($ENV{PICO_SDK_PATH}/external/pico_sdk_import.cmake)

project(printosk_pico C CXX ASM)

# Pico SDK
pico_sdk_init()

# Main executable
add_executable(printosk_pico
    src/main.c
    src/uart.c
    src/command_parser.c
    src/printer.c
    src/usb_printer.c
    src/utils.c
)

# Link libraries
target_link_libraries(printosk_pico
    pico_stdlib
    hardware_uart
    hardware_gpio
    hardware_spi
    pico_time
)

# Include directories
target_include_directories(printosk_pico PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# Compiler flags
target_compile_options(printosk_pico PRIVATE
    -Wall
    -Wextra
    -Werror=format
    -O3
)

# USB output
pico_enable_stdio_usb(printosk_pico 1)
pico_enable_stdio_uart(printosk_pico 0)

# Create map file
pico_add_map_output(printosk_pico)

# Add to USB mass storage
pico_add_uf2_output(printosk_pico)
