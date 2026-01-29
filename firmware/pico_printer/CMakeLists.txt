cmake_minimum_required(VERSION 3.12)

# Pull in SDK (must be before project)
include(pico_sdk_import.cmake)

project(printosk_pico C CXX ASM)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

# Initialize the SDK
pico_sdk_init()

add_executable(pico_printer
    pico_printer.c
)

# Pull in common dependencies
target_link_libraries(pico_printer pico_stdlib hardware_uart hardware_gpio)

# Create map/bin/hex file etc.
pico_add_extra_outputs(pico_printer)

# Enable USB output, disable UART output
pico_enable_stdio_usb(pico_printer 1)
pico_enable_stdio_uart(pico_printer 0)
