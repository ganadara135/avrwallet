.SUFFIXES = .c .o .d
CC=gcc
#헤더파일 탐색할 디렉토리 # something require quotation mark "INC" such as VS
#INC=F:\MinGW\msys\1.0\home\gmp-6.1.2
INC=F:\Atmel\work\avrwallet\avrwallet\pctest
LIBS=F:\Atmel\work\avrwallet\avrwallet\pctest
#링크 디렉토리
#LIBS=F:\MinGW\msys\1.0\home\gmp-6.1.2
CFLAGS=-g -Wall
OBJDIR=Debug
_OBJS=hwb_tester.o

myOBJS= $(patsubst %,$(OBJDIR)/%,$(_OBJS))
C_DEPS +=  \
	hwb_tester.d

SRCS = $(_OBJS:.o=.c)
TARGET=whole


blockFirst:
	@echo first target blocking

printVar: blockFirst
	@echo $<

move:
	@echo msg: move object files
	mv -v $(wildcard *.o) Debug

clean:
	rm -rf $(wildcard $(OBJDIR)/*.o)

depPrint: hwb_tester.c
	gcc -M $< -o checkDep.d -I$(INC)

#gcc -M $< -o checkDep.d -I$(INC)

$(TARGET): $(SRCS)
	$(CC) -g -o $@.exe -c $^ -I$(INC)
# don't forget to set both -L(디렉토리위치) and -l(화일명)
# file name(화일명) looks like "lib화일명".
# so get rid of "lib" symbol and use only "화일명"

#endian.o: endian.c
#	$(CC) -g -c $< 

#bignum256.o: bignum256.c
#	$(CC) -g -c $< -I$(INC)

#allsrc: $(SRCS)
#	$(CC) -g -c $^ -I$(LIBS)\gmp\include
#allobj: $(_OBJS)
#	$(CC) -o start $^ -I$(LIBS)\gmp\include
# comments I find commnets symbol of MakeFile



%.o: %.c
	@echo test10
	$(CC) -g -o $@ ${CFLAG} -c $<
ppp: $(_OBJS)
	@echo $^

aaa: $(SRCS)
	$(CC) -g -Wall -o aaa -c $(SRCS) -L.

mytest: aes.o bignum256.o test_helpers.o
	$(CC) -o $@ $(foreach dirOBJS,$(OBJS),$(OBJDIR)/$(dirOBJS))

all: clean dep depPrint test


test6:
	@echo $(wildcard *.o)


test:
	@echo Building file: $@ $* $< $?

test7:
	@echo msg: easy compile
	gcc -o hi  $(SRCS)  -L.
	

dep: 
	gccmakedep $(SRCS)

dirChange:
	cd debug ; $(MAKE)

dir:
	@echo $(foreach dirOBJS,$(OBJS),$(OBJDIR)/$(dirOBJS))



