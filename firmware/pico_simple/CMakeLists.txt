cmake_minimum_required(VERSION 3.12)

# Pull in SDK (must be before project)
include(pico_sdk_import.cmake)

project(pico_simple)

# Initialize the SDK
pico_sdk_init()

# Add executable
add_executable(pico_simple
    pico_simple.c
)

# Pull in common dependencies
target_link_libraries(pico_simple
    pico_stdlib
    hardware_uart
    hardware_gpio
)

# Enable USB output, disable UART output
pico_enable_stdio_usb(pico_simple 0)
pico_enable_stdio_uart(pico_simple 0)

# Create UF2 output
pico_add_uf2_output(pico_simple)
