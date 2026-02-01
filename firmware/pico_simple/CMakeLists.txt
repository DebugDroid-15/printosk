cmake_minimum_required(VERSION 3.12)

# Set PICO_SDK_PATH if not already set
if(NOT DEFINED PICO_SDK_PATH)
    set(PICO_SDK_PATH "$ENV{PICO_SDK_PATH}")
    if(NOT PICO_SDK_PATH)
        message(FATAL_ERROR "PICO_SDK_PATH environment variable or CMake variable must be set")
    endif()
endif()

# Pull in SDK (must be before project)
include(${PICO_SDK_PATH}/external/pico_sdk_import.cmake)

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

# Create UF2 output (disabled - use separate elf2uf2.py script)
# pico_add_uf2_output(pico_simple)
